import { Item } from "../../entities/Item";

export interface IItemService {
  createItem(name: string, categoryId: string, userId: string): Promise<Item>;
  toggleItemComplete(item: Item): Promise<void>;
  deleteItem(id: string): Promise<void>;
  getItemsByCategory(categoryId: string): Promise<Item[]>;
  deleteItemsByCategory(categoryId: string): Promise<void>;
  updateItem(item: Item): Promise<void>;
  getItemById(id: string): Promise<Item | null>;
  exists(id: string): Promise<boolean>;
}
