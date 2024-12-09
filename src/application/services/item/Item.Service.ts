import { inject, injectable } from "tsyringe";
import { IItemsRepository } from "../../../domain/interfaces/repositories/IItemsRepository";
import { Item } from "../../../domain/entities/Item";
import { EntityManager } from "typeorm";
import { CategoryId } from "../../../domain/value-objects/CategoryId";
import { UserId } from "../../../domain/value-objects/UserId";
import { ObjectId } from "mongodb";
import { IItemService } from "../../../domain/interfaces/services/IItemService";

@injectable()
export class ItemService implements IItemService {
  constructor(
    @inject("IItemsRepository") private itemRepository: IItemsRepository
  ) {}

  async createItem(name: string, categoryId: string, userId: string): Promise<Item> {
    const item = Item.create(
      new ObjectId().toHexString(),
      name,
      CategoryId.from(categoryId),
      UserId.from(userId),
      false
    );
    await this.itemRepository.save(item);
    return item;
  }

  async toggleItemComplete(item: Item): Promise<void> {
    item.toggleComplete();
    await this.itemRepository.save(item);
  }

  async deleteItem(id: string): Promise<void> {
    await this.itemRepository.delete(id);
  }

  async getItemsByCategory(categoryId: string): Promise<Item[]> {
    return await this.itemRepository.findByCategoryId(CategoryId.from(categoryId));
  }

  async deleteItemsByCategory(categoryId: string): Promise<void> {
    await this.itemRepository.deleteByCategoryId(CategoryId.from(categoryId));
  }

  async updateItem(item: Item): Promise<void> {
    await this.itemRepository.save(item);
  }

  async getItemById(id: string): Promise<Item | null> {
    return await this.itemRepository.findById(id);
  }

  async exists(id: string): Promise<boolean> {
    return await this.itemRepository.exists(id);
  }
}
