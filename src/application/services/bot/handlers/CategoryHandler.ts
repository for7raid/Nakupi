import { Markup } from "telegraf";
import { inject, injectable } from "tsyringe";
import { BaseHandler } from "./BaseHandler";
import { BotContext, BotActions } from "../../../../application/types/telegram.types";
import { ICategoriesService } from "../../../../domain/interfaces/services/ICategoriesService";
import { Category } from "../../../../domain/entities/Category";

@injectable()
export class CategoryHandler extends BaseHandler {
  constructor(
    @inject("ICategoriesService") private categoriesService: ICategoriesService
  ) {
    super();
  }

  async handleAddCategory(ctx: BotContext): Promise<void> {
    try {
      this.ensureSession(ctx);
      ctx.session.isAddingCategory = true;

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('⬅️ Отмена', BotActions.BACK_TO_CATEGORIES)]
      ]);

      await ctx.reply('Введите название новой категории:', keyboard);
    } catch (error) {
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
