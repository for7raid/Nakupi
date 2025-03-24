import { ShoppingListItem } from '../models/ShoppingListItem';

export interface IItemRepository {
    addItem(item: ShoppingListItem): Promise<ShoppingListItem>;
    removeItem(id: string): Promise<void>;
    getItems(userId: string, categoryId?: string): Promise<ShoppingListItem[]>;
    markAsPurchased(id: string): Promise<void>;
    markAsNotPurchased(id: string): Promise<void>;
    removeItemsByCategory(categoryId: string): Promise<void>;
    updateItemQuantity(id: string, quantity: number): Promise<void>;
} 