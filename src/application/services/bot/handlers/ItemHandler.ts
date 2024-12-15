import { Markup } from "telegraf";
import { inject, injectable } from "tsyringe";
import { ObjectId } from "mongodb";
import { BaseHandler } from "./BaseHandler";
import { BotContext, BotActions } from "../../../../application/types/telegram.types";
import { IItemsRepository } from "../../../../domain/interfaces/repositories/IItemsRepository";
import { Item } from "../../../../domain/entities/Item";
import { CategoryId } from "../../../../domain/value-objects/CategoryId";
import { UserId } from "../../../../domain/value-objects/UserId";

@injectable()
export class ItemHandler extends BaseHandler {
  constructor(
    @inject("IItemsRepository") private itemRepositories: IItemsRepository
  ) {
    super();
  }

  async requestAddItem(ctx: BotContext, categoryId: string): Promise<void> {
    try {
      if (!ctx.session) {
        ctx.session = {};
      }

      ctx.session.isAddingItem = true;
      ctx.session.selectedCategoryId = categoryId;
      await this.saveSession(ctx);

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('⬅️ Отмена', BotActions.BACK_TO_ITEMS)]
      ]);

      await ctx.reply('Введите название нового товара:', keyboard);
    } catch (error) {
      await this.handleError(ctx, error);
    }
  }

  async handleAddItem(ctx: BotContext): Promise<void> {
    try {
      const userId = this.getUserId(ctx);
      if (!userId) throw new Error('User ID not found');

      const text = ctx.message?.text;
      const categoryId = ctx.session?.selectedCategoryId;
      console.log(`Item text: ${text}, Category ID: ${categoryId}`);

      if (!text || !categoryId) {
        return;
      }

      const newItem = Item.create(
        new ObjectId().toHexString(),
        text,
        CategoryId.from(categoryId),
        UserId.from(userId),
        false
      );

      console.log(`New item created: ${JSON.stringify(newItem)}`);

      await this.itemRepositories.save(newItem);
      
      ctx.session.isAddingItem = false;
      ctx.session.selectedCategoryId = undefined;
      await this.saveSession(ctx);
      
      await ctx.reply(`✅ Товар "${text}" успешно добавлен!`);
      await this.showCategoryItems(ctx, categoryId);
    } catch (error) {
      console.error('Error in handleAddItem:', error);
      await this.handleError(ctx, error);
    }
  }

  async handleToggleItem(ctx: BotContext): Promise<void> {
    try {
      const itemId = ctx.match?.[1];
      if (!itemId) {
        console.error('Item ID not found in callback data');
        return;
      }

      console.log(`Toggling item with ID: ${itemId}`);
      
      const item = await this.itemRepositories.findById(itemId);
      if (!item) {
        await ctx.reply('❌ Товар не найден');
        console.log('Item not found');
        return;
      }

      await this.itemRepositories.toggleComplete(item);
      console.log(`Item toggled: ${JSON.stringify(item)}`);

      await this.showCategoryItems(ctx, item.categoryId.toString());
    } catch (error) {
      console.error('Error in handleToggleItem:', error);
      await this.handleError(ctx, error);
    }
  }

  async showCategoryItems(ctx: BotContext, categoryId: string, showCompleted: boolean = false): Promise<void> {
    try {
      console.log('Show category items for category:', CategoryId.from(categoryId));

      const items = await this.itemRepositories.findByCategoryId(CategoryId.from(categoryId));
      const filteredItems = showCompleted ? items : items.filter(item => !item.isCompleted);

      let message = filteredItems.length > 0 ? 'Товары в категории:\n\n' : 'В этой категории пока нет товаров.';
      
      filteredItems.forEach((item, index) => {
        const status = item.isCompleted ? '✅' : '⭕️';
        message += `${index + 1}. ${status} ${item.name}\n`;
      });

      const buttons = [
        [Markup.button.callback('➕ Добавить товар', `${BotActions.ADD_ITEM}:${categoryId}`)],
        [Markup.button.callback('⬅️ К категориям', BotActions.BACK_TO_CATEGORIES)]
      ];

      if (filteredItems.length > 0) {
        buttons.unshift(
          filteredItems.map(item => 
            Markup.button.callback(
              `${item.isCompleted ? '✅' : '⭕️'} ${item.name}`,
              `${BotActions.TOGGLE_ITEM}:${item.id}`
            )
          )
        );
      }

      const keyboard = Markup.inlineKeyboard(buttons);
      await ctx.reply(message, keyboard);
    } catch (error) {
      console.error('Error in showCategoryItems:', error);
      await this.handleError(ctx, error);
    }
  }
}
