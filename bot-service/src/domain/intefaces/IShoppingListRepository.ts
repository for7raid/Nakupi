import { ShoppingListItem } from '../models/ShoppingListItem';
import { Category } from '../models/Category';

export interface IShoppingListRepository {
    addItem(item: ShoppingListItem): Promise<void>;
    removeItem(id: string): Promise<void>;
    getItems(userId: string, category?: string): Promise<ShoppingListItem[]>;
    addCategory(category: Category): Promise<void>;
    getCategories(userId: string): Promise<Category[]>;
    removeCategory(id: string): Promise<void>;
    markAsPurchased(id: string): Promise<void>;
    markAsNotPurchased(id: string): Promise<void>;
}