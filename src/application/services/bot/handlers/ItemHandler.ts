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

  async handleAddItem(ctx: BotContext): Promise<void> {
    try {
      const userId = this.getUserId(ctx);
      console.log(`Adding item for user: ${userId}`);
      if (!userId) throw new Error('User ID not found');

      const text = ctx.message?.text;
      const categoryId = ctx.session?.currentCategoryId;
      console.log(`Item text: ${text}, Category ID: ${categoryId}`);

      if (!text || !categoryId) {
        this.ensureSession(ctx);
        ctx.session.isAddingItem = true;
        console.log('Setting isAddingItem to true');
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
      console.log(`New item created: ${JSON.stringify(newItem)}`);

      await this.itemRepositories.save(newItem);
      await this.showCategoryItems(ctx, categoryId);
    } catch (error) {
      console.error('Error in handleAddItem:', error);
      await this.handleError(ctx, error);
    }
  }

  async handleToggleItem(ctx: BotContext): Promise<void> {
    try {
      if (!ctx.callbackQuery) return;

      const match = (ctx.callbackQuery as any).data?.match(/^toggle_item_(.+)$/);
      if (!match) return;

      const itemId = match[1];
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
      const items = await this.itemRepositories.findByCategoryId(CategoryId.from(categoryId));
      let message = showCompleted ? 'Купленные товары:\n' : 'Активные товары:\n';

      const filteredItems = items.filter((item: Item) => showCompleted ? item.isCompleted : !item.isCompleted);

      if (filteredItems.length === 0) {
        message += showCompleted ? '🎉 Нет купленных товаров' : '🤷‍♂️ Список пуст';
      } else {
        filteredItems.forEach((item: Item, index: number) => {
          message += `${index + 1}. ${item.name} ${item.isCompleted ? '✅' : ''}\n`;
        });
      }

      const keyboard = this.getCategoryItemsKeyboard(filteredItems, categoryId, showCompleted);
      await ctx.reply(message, keyboard);
    } catch (error) {
      await this.handleError(ctx, error);
    }
  }

  private getCategoryItemsKeyboard(items: Item[], categoryId: string, showCompleted: boolean): any {
    const itemButtons = items.map((item: Item, index: number) => [
      Markup.button.callback(
        `${index + 1}. ${item.name} ${item.isCompleted ? '✅' : ''}`,
        `${BotActions.TOGGLE_ITEM}:${item.id}`
      )
    ]);

    const controlButtons = [
      [
        Markup.button.callback(
          showCompleted ? '👈 Показать активные' : '✅ Показать купленные',
          `toggle_completed:${categoryId}`
        )
      ],
      [Markup.button.callback('➕ Добавить товар', `${BotActions.ADD_ITEM}:${categoryId}`)],
      [Markup.button.callback('⬅️ Назад', BotActions.BACK_TO_CATEGORIES)]
    ];

    return Markup.inlineKeyboard([...itemButtons, ...controlButtons]);
  }
}
