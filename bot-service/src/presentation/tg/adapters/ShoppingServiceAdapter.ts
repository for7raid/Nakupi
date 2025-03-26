import { ShoppingListApplicationService } from '../../../application/services/ShoppingListApplicationService';
import { UserApplicationService } from '../../../application/services/UserApplicationService';
import { CategoryDto } from '../../../application/dto/CategoryDto';
import { ShoppingListItemDto } from '../../../application/dto/ShoppingListItemDto';
import { IShoppingServiceAdapter } from './IShoppingServiceAdapter';

export class ShoppingServiceAdapter implements IShoppingServiceAdapter {
    constructor(
        private readonly shoppingListService: ShoppingListApplicationService,
        private readonly userService: UserApplicationService
    ) {}

    async getCategories(userId: string): Promise<CategoryDto[]> {
        return await this.shoppingListService.getCategories(userId);
    }

    async getItems(userId: string, categoryId?: string): Promise<ShoppingListItemDto[]> {
        return await this.shoppingListService.getItems(userId, categoryId);
    }

    async addCategory(userId: string, name: string): Promise<CategoryDto> {
        return await this.shoppingListService.addCategory(userId, name);
    }

    async removeCategory(userId: string, categoryId: string): Promise<void> {
        await this.shoppingListService.removeCategory(userId, categoryId);
    }

    async renameCategory(userId: string, categoryId: string, name: string): Promise<CategoryDto> {
        return await this.shoppingListService.renameCategory(userId, categoryId, name);
    }

    async addItem(userId: string, categoryId: string, name: string, quantity: number): Promise<ShoppingListItemDto> {
        return await this.shoppingListService.addItem(userId, categoryId, name, quantity);
    }

    async markItemAsPurchased(userId: string, itemId: string): Promise<ShoppingListItemDto> {
        return await this.shoppingListService.markItemAsPurchased(userId, itemId);
    }

    async markItemAsNotPurchased(userId: string, itemId: string): Promise<ShoppingListItemDto> {
        return await this.shoppingListService.markItemAsNotPurchased(userId, itemId);
    }

    async removeItem(userId: string, itemId: string): Promise<void> {
        await this.shoppingListService.removeItem(userId, itemId);
    }

    async clearPurchasedItems(userId: string): Promise<void> {
        await this.shoppingListService.clearPurchasedItems(userId);
    }

    async updateItemQuantity(userId: string, itemId: string, quantity: number): Promise<ShoppingListItemDto> {
        return await this.shoppingListService.updateItemQuantity(userId, itemId, quantity);
    }

    async saveUser(user: { id: string, name: string }): Promise<any> {
        return await this.userService.registerUser(user.id, user.name);
    }

    async createShareCode(userId: string, categoryId: string, shareCode: string): Promise<void> {
        return await this.shoppingListService.createShareCode(userId, categoryId, shareCode);
    }

    async joinSharedList(userId: string, shareCode: string): Promise<CategoryDto> {
        return await this.shoppingListService.joinSharedList(userId, shareCode);
    }

    async syncSharedListItems(userId: string, categoryId: string): Promise<void> {
        return await this.shoppingListService.syncSharedListItems(userId, categoryId);
    }

    async revokeListAccess(ownerUserId: string, categoryId: string, targetUserId: string): Promise<void> {
        return await this.shoppingListService.revokeListAccess(ownerUserId, categoryId, targetUserId);
    }

    async getUsersWithAccess(userId: string, categoryId: string): Promise<{ id: string, isOwner: boolean }[]> {
        return await this.shoppingListService.getUsersWithAccess(userId, categoryId);
    }
} 