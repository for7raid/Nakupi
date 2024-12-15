import { inject, injectable } from "tsyringe";
import { Markup } from "telegraf";
import { BaseHandler } from "./BaseHandler";
import { BotContext, BotActions } from "../../../../application/types/telegram.types";
import { ICategoriesService } from "../../../../domain/interfaces/services/ICategoriesService";
import { Category } from "../../../../domain/entities/Category";
import { UserId } from "../../../../domain/value-objects/UserId";

@injectable()
export class CategoryHandler extends BaseHandler {
  constructor(
    @inject("ICategoriesService") private readonly categoriesService: ICategoriesService
  ) {
    super();
  }

  async requestAddCategory(ctx: BotContext): Promise<void> {
    try {
      if (!ctx.session) {
        ctx.session = {};
      }
      
      ctx.session.isAddingCategory = true;
      await this.saveSession(ctx);
      console.log('Session state after setting flag:', ctx.session);

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('⬅️ Отмена', BotActions.BACK_TO_CATEGORIES)]
      ]);

      await ctx.reply('Введите название новой категории:', keyboard);
    } catch (error) {
      console.error('Error in requestAddCategory:', error);
      await this.handleError(ctx, error);
    }
  }

  async createCategory(ctx: BotContext): Promise<Category | void> {
    try {
      const text = ctx.message?.text;
      const userId = ctx.from?.id.toString();

      if (!text || !userId) {
        return;
      }

      console.log(`Creating category with name: ${text} for user: ${userId}`);
      const category: Category = await this.categoriesService.create(text, userId);
      console.log(`Category created:`, category);
      
      ctx.session.isAddingCategory = false;
      await this.saveSession(ctx);
      
      await ctx.reply(`✅ Категория "${text}" успешно создана!`);
      return category;
    } catch (error) {
      console.error('Error creating category:', error);
      await this.handleError(ctx, error);
    }
  }

  async handleDeleteCategory(ctx: BotContext): Promise<void> {
    try {
      if (!ctx.callbackQuery) return;

      const match = (ctx.callbackQuery as any).data?.match(/^delete_category_(.+)$/);
      if (!match) {
        const userId = this.getUserId(ctx);
        if (!userId) throw new Error('User ID not found');

        const categories = await this.categoriesService.findByUserId(userId);
        const buttons = categories.map((cat: Category) => [
          Markup.button.callback(cat.name, `delete_category_${cat.id.toString()}`)
        ]);

        buttons.push([Markup.button.callback('⬅️ Назад', BotActions.BACK_TO_CATEGORIES)]);

        await ctx.reply('Выберите категорию для удаления:', Markup.inlineKeyboard(buttons));
        return;
      }

      const categoryId = match[1];
      await this.categoriesService.delete(categoryId);
      await ctx.reply('✅ Категория удалена');
    } catch (error) {
      await this.handleError(ctx, error);
    }
  }

  async getMainMenuKeyboard(userId: string): Promise<any> {
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
}
