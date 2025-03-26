import { CategoryDto } from '../../../application/dto/CategoryDto';
import { ShoppingListItemDto } from '../../../application/dto/ShoppingListItemDto';

export interface IShoppingServiceAdapter {
    getCategories(userId: string): Promise<CategoryDto[]>;
    getItems(userId: string, categoryId?: string): Promise<ShoppingListItemDto[]>;
    addCategory(userId: string, name: string): Promise<CategoryDto>;
    removeCategory(userId: string, categoryId: string): Promise<void>;
    renameCategory(userId: string, categoryId: string, name: string): Promise<CategoryDto>;
    addItem(userId: string, categoryId: string, name: string, quantity: number): Promise<ShoppingListItemDto>;
    markItemAsPurchased(userId: string, itemId: string): Promise<ShoppingListItemDto>;
    markItemAsNotPurchased(userId: string, itemId: string): Promise<ShoppingListItemDto>;
    removeItem(userId: string, itemId: string): Promise<void>;
    clearPurchasedItems(userId: string): Promise<void>;
    updateItemQuantity(userId: string, itemId: string, quantity: number): Promise<ShoppingListItemDto>;
    saveUser(user: { id: string, name: string }): Promise<any>;
    createShareCode(userId: string, categoryId: string, shareCode: string): Promise<void>;
    joinSharedList(userId: string, shareCode: string): Promise<CategoryDto>;
    syncSharedListItems(userId: string, categoryId: string): Promise<void>;
    revokeListAccess(ownerUserId: string, categoryId: string, targetUserId: string): Promise<void>;
    getUsersWithAccess(userId: string, categoryId: string): Promise<{ id: string, isOwner: boolean }[]>;
} 