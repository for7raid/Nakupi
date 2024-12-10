import { Context, Markup, Telegraf } from "telegraf";
import { injectable, inject } from "tsyringe";
import { IUserRepository } from "../../../domain/interfaces/repositories/IUserRepository";
import { connectToDatabase } from "../../../infrastructure/database";
import { BotContext, BotActions } from "../../types/telegram.types";
import { IBotService } from "../../../domain/interfaces/services/IBotService";
import { CategoryHandler } from "./handlers/CategoryHandler";
import { ItemHandler } from "./handlers/ItemHandler";
import { User } from "../../../domain/entities/User";

@injectable()
export class BotService implements IBotService {
  private bot!: Telegraf<BotContext>;
  
  constructor(
    @inject("IUserRepository") private userRepository: IUserRepository,
    private categoryHandler: CategoryHandler,
    private itemHandler: ItemHandler
  ) {}

  async init(token: string | undefined): Promise<void> {
    if (!token) {
      throw new Error('❌ Bot token not provided.');
    }

    this.bot = new Telegraf<BotContext>(token);

    // Middleware to handle session
    this.bot.use((ctx: BotContext, next: () => Promise<void>) => {
      if (ctx.from?.id && !ctx.session) {
        ctx.session = {};
        console.log('Session initialized for user:', ctx.from.id);
      }
      return next();
    });

    // Command handlers
    this.bot.command('start', (ctx: BotContext) => this.handleStart(ctx));

    // Action handlers
    this.bot.action(new RegExp(`^${BotActions.SELECT_CATEGORY}:(.+)$`), (ctx: BotContext) => this.handleSelectCategory(ctx));
    this.bot.action(BotActions.DELETE_CATEGORY, (ctx: BotContext) => this.categoryHandler.handleDeleteCategory(ctx));
    this.bot.action(BotActions.ADD_CATEGORY, (ctx: BotContext) => this.categoryHandler.handleAddCategory(ctx));
    this.bot.action(BotActions.BACK_TO_CATEGORIES, (ctx: BotContext) => this.showMainMenu(ctx));
    this.bot.action(new RegExp(`^${BotActions.TOGGLE_ITEM}:(.+)$`), (ctx: BotContext) => this.itemHandler.handleToggleItem(ctx));
    this.bot.action(new RegExp(`^${BotActions.ADD_ITEM}:(.+)$`), (ctx: BotContext) => this.itemHandler.handleAddItem(ctx));

    // Message handlers
    this.bot.on('text', (ctx: BotContext) => this.handleText(ctx));

    try {
      await connectToDatabase();
      await this.bot.launch();
      console.log('🚀 Bot successfully started');
    } catch (error) {
      console.error('🚨 Error launching bot:', error);
      throw error;
    }
  }

  async start(): Promise<void> {
    if (!this.bot) {
      throw new Error('Bot not initialized');
    }
    await this.bot.launch();
  }

  async stop(): Promise<void> {
    if (this.bot) {
      await this.bot.stop();
    }
  }

  private async handleStart(ctx: BotContext): Promise<void> {
    try {
      const userId = ctx.from.id;
      const user = await this.userRepository.findByTelegramId(userId.toString());
      await this.sendGreeting(ctx, user);
      await this.showMainMenu(ctx);
    } catch (error) {
      console.error('Error in handleStart:', error);
      await ctx.reply('Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  }

  private async handleSelectCategory(ctx: BotContext): Promise<void> {
    const categoryId = ctx.callbackQuery?.data as string; // Use string type directly
    console.log(`Selected category ID: ${categoryId}`); // Log the selected category ID

    if (categoryId) {
        ctx.session.currentCategoryId = categoryId;
        console.log(`Current category ID set in session: ${ctx.session.currentCategoryId}`); // Log setting the category ID

        await ctx.reply('Вы выбрали категорию. Теперь введите название товара:');
        ctx.session.isAddingItem = true;
    } else {
        await ctx.reply('❌ Ошибка при выборе категории. Пожалуйста, попробуйте снова.');
    }
  }

  private async handleText(ctx: BotContext): Promise<void> {
    const text = ctx.message?.text;
    const userId = ctx.from?.id.toString();

    console.log(`Received text: ${text}`); // Log the received text
    console.log(`Session state: ${JSON.stringify(ctx.session)}`); // Log the session state

    if (!text || !userId) {
      return;
    }
    
    console.log(ctx.session?.isAddingItem)

    try {
      if (ctx.session?.isAddingCategory) {
        const newCategory = await this.categoryHandler.handleAddCategory(ctx);
        ctx.session.isAddingCategory = false;
        await this.showMainMenu(ctx);
        return;
      }

      if (ctx.session?.isAddingItem) {
        await this.itemHandler.handleAddItem(ctx);
        return;
      }
    } catch (error) {
      console.error('Error in handleText:', error);
      await ctx.reply('Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  }

  private async showMainMenu(ctx: BotContext): Promise<void> {
    try {
      const userId = ctx.from?.id.toString();
      if (!userId) throw new Error('User ID not found');

      const keyboard = await this.categoryHandler.getMainMenuKeyboard(userId);
      await ctx.reply('Выберите категорию или создайте новую:', keyboard);
    } catch (error) {
      console.error('Error showing main menu:', error);
      await ctx.reply('Произошла ошибка при отображении меню. Пожалуйста, попробуйте позже.');
    }
  }

  private async sendGreeting(ctx: BotContext, user: User | null): Promise<void> {
    const greetingMessage = user ? 'Добро пожаловать назад!' : 'Добро пожаловать!';
    await ctx.reply(greetingMessage);
  }
}
