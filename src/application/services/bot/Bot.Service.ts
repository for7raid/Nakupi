import { Context, Markup, Telegraf } from "telegraf";
import { injectable, inject } from "tsyringe";
import { IUserRepository } from "../../../domain/interfaces/repositories/IUserRepository";
import { connectToDatabase } from "../../../infrastructure/database";
import { BotContext, BotActions } from "../../types/telegram.types";
import { IBotService } from "../../../domain/interfaces/services/IBotService";
import { CategoryHandler } from "./handlers/CategoryHandler";
import { ItemHandler } from "./handlers/ItemHandler";
import { User } from "../../../domain/entities/User";
import LocalSession from "telegraf-session-local";

@injectable()
export class BotService implements IBotService {
  private bot!: Telegraf<BotContext>;
  private localSession!: LocalSession<BotContext>;
  
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

    // Session middleware
    this.localSession = new LocalSession({
      database: 'sessions.json',
      property: 'session',
      storage: LocalSession.storageFileSync,
      format: {
        serialize: (obj: any) => JSON.stringify(obj, null, 2),
        deserialize: (str: string) => JSON.parse(str),
      },
      state: { }
    });
    this.bot.use(this.localSession.middleware());

    // Command handlers
    this.bot.command('start', (ctx: BotContext) => this.handleStart(ctx));

    // Action handlers
    this.bot.action(new RegExp(`^${BotActions.SELECT_CATEGORY}:(.+)$`), (ctx: BotContext) => this.handleSelectCategory(ctx));
    this.bot.action(BotActions.DELETE_CATEGORY, (ctx: BotContext) => this.categoryHandler.handleDeleteCategory(ctx));
    this.bot.action(BotActions.ADD_CATEGORY, (ctx: BotContext) => this.categoryHandler.requestAddCategory(ctx));
    this.bot.action(BotActions.BACK_TO_CATEGORIES, (ctx: BotContext) => this.showMainMenu(ctx));
    this.bot.action(new RegExp(`^${BotActions.TOGGLE_ITEM}:(.+)$`), (ctx: BotContext) => this.itemHandler.handleToggleItem(ctx));
    this.bot.action(new RegExp(`^${BotActions.ADD_ITEM}:(.+)$`), async (ctx: BotContext) => {
      const categoryId = ctx.match?.[1];
      if (categoryId) {
        await this.itemHandler.requestAddItem(ctx, categoryId);
      }
    });
    this.bot.action(BotActions.BACK_TO_ITEMS, async (ctx: BotContext) => {
      const categoryId = ctx.session?.selectedCategoryId;
      if (categoryId) {
        await this.itemHandler.showCategoryItems(ctx, categoryId);
      }
    });

    // Message handlers
    this.bot.on('text', (ctx: BotContext) => this.handleText(ctx));

    try {
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

    const categoryId = ctx.match ? ctx.match[1] : undefined; 

    if (categoryId) {
        ctx.session.selectedCategoryId = categoryId;
        console.log(`Current category ID set in session: ${ctx.session.selectedCategoryId}`); // Log setting the category ID
        
        this.itemHandler.showCategoryItems(ctx, categoryId);
    } else {
        await ctx.reply('❌ Ошибка при выборе категории. Пожалуйста, попробуйте снова.');
    }
  }

  private async handleText(ctx: BotContext): Promise<void> {
    const text = ctx.message?.text;
    const userId = ctx.from?.id.toString();

    console.log(`Received text: ${text}`);
    console.log(`Session state:`, ctx.session);

    if (!text || !userId) {
      return;
    }

    try {
      if (ctx.session?.isAddingCategory) {
        console.log('Creating category...');
        await this.categoryHandler.createCategory(ctx);
        ctx.session.isAddingCategory = false;
        await this.showMainMenu(ctx);
        return;
      }

      if (ctx.session?.isAddingItem) {
        await this.itemHandler.handleAddItem(ctx);
        ctx.session.isAddingItem = false;
        return;
      }
    } catch (error) {
      console.error('Error in handleText:', error);
      await ctx.reply('Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  }

  private async showMainMenu(ctx: BotContext): Promise<void> {
    
    ctx.session.isAddingCategory = false;
    ctx.session.isAddingItem = false;

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
