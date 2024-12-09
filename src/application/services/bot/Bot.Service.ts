import { Context, Markup, Telegraf } from "telegraf";
import { injectable, inject } from "tsyringe";
import { ObjectId } from "mongodb";
import { EntityManager } from "typeorm";

import { User } from "../../../domain/entities/User";
import { Item } from "../../../domain/entities/Item";
import { Category } from "../../../domain/entities/Category";
import { UserId } from "../../../domain/value-objects/UserId";
import { CategoryId } from "../../../domain/value-objects/CategoryId";
import { ICategoriesService } from "../../../domain/interfaces/services/ICategoriesService";
import { IItemsRepository } from "../../../domain/interfaces/repositories/IItemsRepository";
import { IUserRepository } from "../../../domain/interfaces/repositories/IUserRepository";
import { connectToDatabase } from "../../../infrastructure/database";
import { BotContext, BotActions } from "../../types/telegram.types";
import { IBotService } from "../../../domain/interfaces/services/IBotService";

enum ExtendedBotActions {
  TOGGLE_COMPLETED = 'toggle_completed'
}

@injectable()
export class BotService implements IBotService {
  private userRepository: IUserRepository;
  private categoriesService: ICategoriesService;
  private itemRepositories: IItemsRepository;
  private bot?: Telegraf<BotContext>;

  constructor(
    @inject("IUserRepository") userRepository: IUserRepository,
    @inject("ICategoriesService") categoriesService: ICategoriesService,
    @inject("IItemsRepository") itemRepositories: IItemsRepository
  ) {
    this.userRepository = userRepository;
    this.categoriesService = categoriesService;
    this.itemRepositories = itemRepositories;
  }

  async init(token: string | undefined): Promise<void> {
    if (!token) {
      throw new Error('❌ Bot token not provided.');
    }

    this.bot = new Telegraf<BotContext>(token);

    // Middleware to handle session
    this.bot.use((ctx: BotContext, next: () => Promise<void>) => {
      const userId = ctx.from?.id;
      if (userId) {
        if (!ctx.session) {
          ctx.session = {};
        }
      }
      return next();
    });

    // Command handlers
    this.bot.command('start', (ctx: BotContext) => this.handleStart(ctx));

    // Action handlers
    this.bot.action(new RegExp(`^${BotActions.SELECT_CATEGORY}:(.+)$`), (ctx: BotContext) => this.handleSelectCategory(ctx));
    this.bot.action(BotActions.DELETE_CATEGORY, (ctx: BotContext) => this.handleDeleteCategory(ctx));
    this.bot.action(new RegExp(`^${BotActions.TOGGLE_ITEM}:(.+)$`), (ctx: BotContext) => this.handleToggleItem(ctx));
    this.bot.action(new RegExp(`^${BotActions.ADD_ITEM}:(.+)$`), async (ctx: BotContext) => {
      if (!ctx.callbackQuery) return;

      const match = (ctx.callbackQuery as any).data?.match(new RegExp(`^${BotActions.ADD_ITEM}:(.+)$`));
      if (match && match[1]) {
        const categoryId = match[1];
        if (ctx.session) {
          ctx.session.isAddingItem = true;
          ctx.session.currentCategoryId = categoryId;
        }
        await this.updateOrSendMessage(ctx, 'Введите название товара:', Markup.inlineKeyboard([]));
      }
    });

    this.bot.action(BotActions.ADD_CATEGORY, (ctx: BotContext) => this.handleAddCategory(ctx));
    this.bot.action(BotActions.BACK_TO_CATEGORIES, (ctx: BotContext) => this.showMainMenu(ctx));
    this.bot.action(BotActions.SHOW_COMPLETED, (ctx: BotContext) => this.handleShowCompleted(ctx));
    this.bot.action(BotActions.MANAGE_CATEGORIES, (ctx: BotContext) => this.handleManageCategories(ctx));

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

  private async getMainMenu(ctx: BotContext): Promise<any> {
    const userId = ctx.from?.id.toString();
    
    if (!userId) {
      throw new Error('User ID not found');
    }

    const categories = await this.categoriesService.findByUserId(userId);
    const categoryButtons = categories.map((category: Category) => [
      Markup.button.callback(
        category.name,
        `${BotActions.SELECT_CATEGORY}:${category.id.toString()}`
      )
    ]);

    const manageButtons = [
      [
        Markup.button.callback('➕ Добавить категорию', BotActions.ADD_CATEGORY),
        Markup.button.callback('❌ Удалить категорию', BotActions.DELETE_CATEGORY)
      ]
    ];

    return Markup.inlineKeyboard([...categoryButtons, ...manageButtons]);
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

  private async sendGreeting(ctx: BotContext, user: User | null): Promise<void> {
    const greetingMessage = user ? 'Добро пожаловать назад!' : 'Добро пожаловать!';
    await ctx.reply(greetingMessage);
  }

  private async showMainMenu(ctx: BotContext): Promise<void> {
    try {
      const message = await ctx.reply('Выберите категорию или создайте новую:', await this.getMainMenu(ctx));
      if (ctx.session) {
        ctx.session.lastMessageId = message.message_id;
      }
    } catch (error) {
      console.error('Error showing main menu:', error);
      await ctx.reply('Произошла ошибка при отображении меню. Пожалуйста, попробуйте позже.');
    }
  }

  private async updateOrSendMessage(ctx: BotContext, text: string, keyboard: any): Promise<void> {
    try {
      if (ctx.session?.lastMessageId) {
        try {
          await ctx.telegram.editMessageText(
            ctx.chat?.id,
            ctx.session.lastMessageId,
            undefined,
            text,
            { ...keyboard, parse_mode: 'HTML' }
          );
          return;
        } catch (error) {
          console.log('Could not edit message, sending new one');
        }
      }
      
      const message = await ctx.reply(text, keyboard);
      if (ctx.session) {
        ctx.session.lastMessageId = message.message_id;
      }
    } catch (error) {
      console.error('Error in updateOrSendMessage:', error);
      await ctx.reply('Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  }

  private async handleManageCategories(ctx: BotContext): Promise<void> {
    try {
      await this.updateOrSendMessage(ctx, '🔧 Управление категориями:', 
        Markup.inlineKeyboard([
          [
            Markup.button.callback('➕ Добавить категорию', BotActions.ADD_CATEGORY),
            Markup.button.callback('❌ Удалить категорию', BotActions.DELETE_CATEGORY)
          ],
          [
            Markup.button.callback('⬅️ В главное меню', BotActions.BACK_TO_CATEGORIES)
          ]
        ])
      );
    } catch (error) {
      console.error('Ошибка при управлении категориями:', error);
      await ctx.reply('Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  }

  private async handleAddCategory(ctx: BotContext): Promise<void> {
    try {
      console.log('handleAddCategory called');
      console.log('Current session:', ctx.session);

      // Инициализируем сессию, если её нет
      if (!ctx.session) {
        ctx.session = {};
      }

      // Устанавливаем флаг
      ctx.session.isAddingCategory = true;
      console.log('Session after setting flag:', ctx.session);

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('⬅️ Отмена', BotActions.BACK_TO_CATEGORIES)]
      ]);

      await this.updateOrSendMessage(ctx, 'Введите название новой категории:', keyboard);
    } catch (error) {
      console.error('Error in handleAddCategory:', error);
      await ctx.reply('Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  }

  private async handleDeleteCategory(ctx: BotContext): Promise<void> {
    try {
      if (!ctx.callbackQuery) return;

      const match = (ctx.callbackQuery as any).data?.match(/^delete_category_(.+)$/);
      if (!match) {
        // Show list of categories to delete
        const userId = ctx.from?.id.toString();
        if (!userId) {
          throw new Error('User ID not found');
        }

        const categories = await this.categoriesService.findByUserId(userId);
        const buttons = categories.map((cat: Category) => [
          Markup.button.callback(cat.name, `delete_category_${cat.id.toString()}`)
        ]);

        buttons.push([Markup.button.callback('⬅️ Назад', BotActions.BACK_TO_CATEGORIES)]);

        await this.updateOrSendMessage(
          ctx,
          'Выберите категорию для удаления:',
          Markup.inlineKeyboard(buttons)
        );
        return;
      }

      const categoryId = match[1];
      try {
        await this.categoriesService.delete(categoryId);
        await this.updateOrSendMessage(ctx, '✅ Категория удалена', await this.getMainMenu(ctx));
      } catch (error) {
        console.error('Error deleting category:', error);
        await this.updateOrSendMessage(ctx, '❌ Ошибка при удалении категории', await this.getMainMenu(ctx));
      }
    } catch (error) {
      console.error('Error in handleDeleteCategory:', error);
      await ctx.reply('Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  }

  private async handleSelectCategory(ctx: BotContext): Promise<void> {
    try {
      const match = (ctx.callbackQuery as any)?.data?.match(new RegExp(`^${BotActions.SELECT_CATEGORY}:(.+)$`));
      if (!match) {
        throw new Error('Invalid callback data');
      }

      const categoryId = match[1];
      if (ctx.session) {
        ctx.session.currentCategoryId = categoryId;
        ctx.session.showCompletedItems = false; // Сбрасываем флаг при выборе категории
      }

      await this.showCategoryItems(ctx, categoryId);
    } catch (error) {
      console.error('Error in handleSelectCategory:', error);
      await ctx.reply('Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  }

  private async handleBackToCategories(ctx: BotContext): Promise<void> {
    try {
      if (ctx.session) {
        ctx.session.currentCategoryId = null;
        ctx.session.isAddingItem = false;
        ctx.session.isAddingCategory = false;
      }
      await this.showMainMenu(ctx);
    } catch (error) {
      console.error('Ошибка при возврате к категориям:', error);
      await ctx.reply('Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  }

  private async handleText(ctx: BotContext): Promise<void> {
    const text = ctx.message?.text;
    const userId = ctx.from?.id.toString();

    if (!text || !userId) {
      return;
    }

    try {
      if (ctx.session?.isAddingCategory) {
        try {
          const newCategory = await this.categoriesService.create(text, userId);

          ctx.session.isAddingCategory = false;
          await this.showMainMenu(ctx);
        } catch (error) {
          console.error('Error creating category:', error);
          await ctx.reply('❌ Ошибка при создании категории');
        }
        return;
      }

      if (ctx.session?.isAddingItem) {
        await this.handleItemText(ctx);
        return;
      }
    } catch (error) {
      console.error('Error in handleText:', error);
      await ctx.reply('Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  }

  private async handleAddItem(ctx: BotContext): Promise<void> {
    try {
      const userId = ctx.from?.id.toString();
      if (!userId) {
        throw new Error('User ID not found');
      }

      const match = (ctx.callbackQuery as any)?.data?.match(/^add_item:(.+)$/);
      if (!match) {
        await ctx.reply('❌ Неверный формат команды');
        return;
      }

      const categoryId = match[1];
      const category = await this.categoriesService.findById(categoryId);
      if (!category) {
        await ctx.reply('❌ Категория не найдена');
        return;
      }

      const text = ctx.message?.text;
      if (!text) {
        ctx.session.isAddingItem = true;
        ctx.session.currentCategoryId = categoryId;
        await ctx.reply('Введите название товара:');
        return;
      }

      const newItem = Item.create(
        new ObjectId().toHexString(),
        text,
        CategoryId.from(categoryId),
        UserId.from(userId),
        false
      );

      await this.itemRepositories.save(newItem);
      await this.showCategoryItems(ctx, categoryId);

    } catch (error) {
      console.error('Error in handleAddItem:', error);
      await ctx.reply('Произошла ошибка при добавлении товара');
    }
  }

  private async handleItemText(ctx: BotContext): Promise<void> {
    try {
      const text = ctx.message?.text;
      const categoryId = ctx.session?.currentCategoryId;
      const userId = ctx.from?.id.toString();

      if (!text || !categoryId || !userId || !ctx.session?.isAddingItem) {
        return;
      }

      const newItem = Item.create(
        new ObjectId().toHexString(),
        text,
        CategoryId.from(categoryId),
        UserId.from(userId),
        false
      );

      await this.itemRepositories.save(newItem);
      
      ctx.session.isAddingItem = false;
      ctx.session.currentCategoryId = undefined;
      
      await this.showCategoryItems(ctx, categoryId);

    } catch (error) {
      console.error('Error in handleItemText:', error);
      await ctx.reply('Произошла ошибка при добавлении товара');
    }
  }

  private async handleToggleItem(ctx: BotContext): Promise<void> {
    try {
      if (!ctx.callbackQuery) return;

      const match = (ctx.callbackQuery as any).data?.match(/^toggle_item_(.+)$/);
      if (!match) return;

      const itemId = match[1];
      const item = await this.itemRepositories.findById(itemId);
      if (!item) {
        await this.updateOrSendMessage(ctx, '❌ Товар не найден', {});
        return;
      }

      await this.itemRepositories.toggleComplete(item);
      await this.showCategoryItems(ctx, item.categoryId.toString());
    } catch (error) {
      console.error('Error in handleToggleItem:', error);
      await ctx.reply('Произошла ошибка при изменении статуса товара');
    }
  }

  private async showCategoryItems(ctx: BotContext, categoryId: string, showCompleted: boolean = false): Promise<void> {
    try {
      const items = await this.itemRepositories.findByCategoryId(CategoryId.from(categoryId));
      console.log('Retrieved items:', items);

      let message = showCompleted ? 'Купленные товары:\n' : 'Активные товары:\n';

      const filteredItems = items.filter((item: Item) => showCompleted ? item.isCompleted : !item.isCompleted);
      console.log('Filtered items:', filteredItems);

      if (filteredItems.length === 0) {
        message += showCompleted ? '🎉 Нет купленных товаров' : '🤷‍♂️ Список пуст';
      } else {
        filteredItems.forEach((item: Item, index: number) => {
          message += `${index + 1}. ${item.name} ${item.isCompleted ? '✅' : ''}\n`;
        });
      }

      const itemButtons = filteredItems.map((item: Item, index: number) => [
        Markup.button.callback(
          `${index + 1}. ${item.name} ${item.isCompleted ? '✅' : ''}`,
          `${BotActions.TOGGLE_ITEM}:${item.id}`
        )
      ]);

      const toggleButton = Markup.button.callback(
        showCompleted ? '👈 Показать активные' : '✅ Показать купленные',
        `${ExtendedBotActions.TOGGLE_COMPLETED}:${categoryId}`
      );

      const addButton = Markup.button.callback('➕ Добавить товар', `${BotActions.ADD_ITEM}:${categoryId}`);
      const backButton = Markup.button.callback('⬅️ Назад', BotActions.BACK_TO_CATEGORIES);

      await this.updateOrSendMessage(
        ctx,
        message,
        Markup.inlineKeyboard([
          ...itemButtons,
          [toggleButton],
          [addButton],
          [backButton]
        ])
      );
    } catch (error) {
      console.error('Error in showCategoryItems:', error);
      await ctx.reply('Произошла ошибка при отображении списка товаров');
    }
  }

  private async handleShowCompleted(ctx: BotContext): Promise<void> {
    try {
      if (!ctx.session?.currentCategoryId) {
        throw new Error('No category selected');
      }

      ctx.session.showCompletedItems = !ctx.session.showCompletedItems;
      await this.showCategoryItems(ctx, ctx.session.currentCategoryId);
    } catch (error) {
      console.error('Error in handleShowCompleted:', error);
      await ctx.reply('Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  }
}
