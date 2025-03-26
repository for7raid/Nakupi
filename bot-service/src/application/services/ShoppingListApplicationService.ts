import { Category } from '@domain/entities/Category';
import { ShoppingListItem } from '@domain/entities/ShoppingListItem';
import { DomainException } from '@domain/exceptions/DomainException';
import { ShoppingListService } from '@domain/services/ShoppingListService';
import { CategoryDto } from '../dto/CategoryDto';
import { ShoppingListItemDto } from '../dto/ShoppingListItemDto';
import { CategoryId } from '@domain/value-objects/CategoryId';
import { UserId } from '@domain/value-objects/UserId';
import { ItemId } from '@domain/value-objects/ItemId';
import { CategoryName } from '@domain/value-objects/CategoryName';
import { ItemName } from '@domain/value-objects/ItemName';
import { Quantity } from '@domain/value-objects/Quantity';
import { ShareCode } from '@domain/value-objects/ShareCode';

/**
 * Сервис приложения для работы со списком покупок.
 * Координирует взаимодействие между API/Telegram-ботом и доменными сервисами.
 */
export class ShoppingListApplicationService {
    constructor(private readonly shoppingListService: ShoppingListService) {}

    /**
     * Добавляет новую категорию для пользователя.
     */
    public async addCategory(userId: string, name: string): Promise<CategoryDto> {
        try {
            const userIdObj = UserId.create(userId);
            const categoryNameObj = CategoryName.create(name);
            const category = await this.shoppingListService.addCategory(userIdObj, categoryNameObj);
            return this.mapToDto(category);
        } catch (error) {
            if (error instanceof DomainException) {
                throw error;
            }
            throw new Error(`Ошибка при добавлении категории: ${error}`);
        }
    }

    /**
     * Переименовывает категорию.
     */
    public async renameCategory(userId: string, categoryId: string, newName: string): Promise<CategoryDto> {
        try {
            const userIdObj = UserId.create(userId);
            const categoryIdObj = CategoryId.create(categoryId);
            const categoryNameObj = CategoryName.create(newName);
            const category = await this.shoppingListService.renameCategory(userIdObj, categoryIdObj, categoryNameObj);
            return this.mapToDto(category);
        } catch (error) {
            if (error instanceof DomainException) {
                throw error;
            }
            throw new Error(`Ошибка при переименовании категории: ${error}`);
        }
    }

    /**
     * Удаляет категорию и все ее элементы.
     */
    public async removeCategory(userId: string, categoryId: string): Promise<void> {
        try {
            const userIdObj = UserId.create(userId);
            const categoryIdObj = CategoryId.create(categoryId);
            await this.shoppingListService.removeCategory(userIdObj, categoryIdObj);
        } catch (error) {
            if (error instanceof DomainException) {
                throw error;
            }
            throw new Error(`Ошибка при удалении категории: ${error}`);
        }
    }

    /**
     * Добавляет новый элемент в список покупок.
     */
    public async addItem(
        userId: string, 
        categoryId: string, 
        name: string, 
        quantity: number
    ): Promise<ShoppingListItemDto> {
        try {
            const userIdObj = UserId.create(userId);
            const categoryIdObj = CategoryId.create(categoryId);
            const itemNameObj = ItemName.create(name);
            const quantityObj = Quantity.create(quantity);
            const item = await this.shoppingListService.addItem(userIdObj, categoryIdObj, itemNameObj, quantityObj);
            return this.mapItemToDto(item);
        } catch (error) {
            if (error instanceof DomainException) {
                throw error;
            }
            throw new Error(`Ошибка при добавлении элемента: ${error}`);
        }
    }

    /**
     * Отмечает элемент как купленный.
     */
    public async markItemAsPurchased(userId: string, itemId: string): Promise<ShoppingListItemDto> {
        try {
            const userIdObj = UserId.create(userId);
            const itemIdObj = ItemId.create(itemId);
            const item = await this.shoppingListService.markItemAsPurchased(userIdObj, itemIdObj);
            return this.mapItemToDto(item);
        } catch (error) {
            if (error instanceof DomainException) {
                throw error;
            }
            throw new Error(`Ошибка при отметке элемента как купленного: ${error}`);
        }
    }

    /**
     * Отмечает элемент как не купленный.
     */
    public async markItemAsNotPurchased(userId: string, itemId: string): Promise<ShoppingListItemDto> {
        try {
            const userIdObj = UserId.create(userId);
            const itemIdObj = ItemId.create(itemId);
            const item = await this.shoppingListService.markItemAsNotPurchased(userIdObj, itemIdObj);
            return this.mapItemToDto(item);
        } catch (error) {
            if (error instanceof DomainException) {
                throw error;
            }
            throw new Error(`Ошибка при отметке элемента как не купленного: ${error}`);
        }
    }

    /**
     * Изменяет количество элемента.
     */
    public async updateItemQuantity(
        userId: string, 
        itemId: string, 
        quantity: number
    ): Promise<ShoppingListItemDto> {
        try {
            const userIdObj = UserId.create(userId);
            const itemIdObj = ItemId.create(itemId);
            const quantityObj = Quantity.create(quantity);
            const item = await this.shoppingListService.updateItemQuantity(userIdObj, itemIdObj, quantityObj);
            return this.mapItemToDto(item);
        } catch (error) {
            if (error instanceof DomainException) {
                throw error;
            }
            throw new Error(`Ошибка при изменении количества элемента: ${error}`);
        }
    }

    /**
     * Удаляет элемент из списка покупок.
     */
    public async removeItem(userId: string, itemId: string): Promise<void> {
        try {
            const userIdObj = UserId.create(userId);
            const itemIdObj = ItemId.create(itemId);
            await this.shoppingListService.removeItem(userIdObj, itemIdObj);
        } catch (error) {
            if (error instanceof DomainException) {
                throw error;
            }
            throw new Error(`Ошибка при удалении элемента: ${error}`);
        }
    }

    /**
     * Очищает все купленные элементы из списка.
     */
    public async clearPurchasedItems(userId: string): Promise<void> {
        try {
            const userIdObj = UserId.create(userId);
            await this.shoppingListService.clearPurchasedItems(userIdObj);
        } catch (error) {
            if (error instanceof DomainException) {
                throw error;
            }
            throw new Error(`Ошибка при очистке купленных элементов: ${error}`);
        }
    }

    /**
     * Получает список категорий пользователя.
     */
    public async getCategories(userId: string): Promise<CategoryDto[]> {
        try {
            const userIdObj = UserId.create(userId);
            const categories = await this.shoppingListService.getCategories(userIdObj);
            return categories.map(category => this.mapToDto(category));
        } catch (error) {
            if (error instanceof DomainException) {
                throw error;
            }
            throw new Error(`Ошибка при получении категорий: ${error}`);
        }
    }

    /**
     * Получает список элементов пользователя.
     */
    public async getItems(userId: string, categoryId?: string): Promise<ShoppingListItemDto[]> {
        try {
            const userIdObj = UserId.create(userId);
            const categoryIdObj = categoryId ? CategoryId.create(categoryId) : undefined;
            const items = await this.shoppingListService.getItems(userIdObj, categoryIdObj);
            return items.map(item => this.mapItemToDto(item));
        } catch (error) {
            if (error instanceof DomainException) {
                throw error;
            }
            throw new Error(`Ошибка при получении элементов: ${error}`);
        }
    }

    /**
     * Преобразует доменный объект категории в DTO.
     */
    private mapToDto(category: Category): CategoryDto {
        const linkedCategoryId = category.getLinkedCategoryId();
        return {
            id: category.getId().value,
            name: category.getName(),
            userId: category.getUserId().value,
            createdAt: category.getCreatedAt(),
            updatedAt: category.getUpdatedAt(),
            shareCode: category.getShareCode(),
            shareCodeExpiry: category.getShareCodeExpiry(),
            linkedCategoryId: linkedCategoryId ? linkedCategoryId.value : null
        };
    }

    /**
     * Преобразует доменный объект элемента в DTO.
     */
    private mapItemToDto(item: ShoppingListItem): ShoppingListItemDto {
        return {
            id: item.id.value,
            name: item.name,
            userId: item.userId.value,
            categoryId: item.categoryId.value,
            quantity: item.quantity.value,
            purchased: item.purchased,
            purchasedDate: item.purchasedAt,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
        };
    }
    
    /**
     * Создает код доступа для категории.
     */
    public async createShareCode(userId: string, categoryId: string, shareCodeText: string): Promise<void> {
        try {
            const userIdObj = UserId.create(userId);
            const categoryIdObj = CategoryId.create(categoryId);
            const shareCodeObj = ShareCode.create(shareCodeText);
            await this.shoppingListService.createShareCode(userIdObj, categoryIdObj, shareCodeObj);
        } catch (error) {
            if (error instanceof DomainException) {
                throw error;
            }
            throw new Error(`Ошибка при создании кода доступа: ${error}`);
        }
    }
    
    /**
     * Присоединяется к списку покупок по коду доступа.
     */
    public async joinSharedList(userId: string, shareCodeText: string): Promise<CategoryDto> {
        try {
            const userIdObj = UserId.create(userId);
            const shareCodeObj = ShareCode.create(shareCodeText);
            const category = await this.shoppingListService.joinSharedList(userIdObj, shareCodeObj);
            return this.mapToDto(category);
        } catch (error) {
            if (error instanceof DomainException) {
                throw error;
            }
            throw new Error(`Ошибка при присоединении к списку: ${error}`);
        }
    }
    
    /**
     * Синхронизирует элементы общего списка.
     */
    public async syncSharedListItems(userId: string, categoryId: string): Promise<void> {
        try {
            const userIdObj = UserId.create(userId);
            const categoryIdObj = CategoryId.create(categoryId);
            await this.shoppingListService.syncSharedListItems(userIdObj, categoryIdObj);
        } catch (error) {
            if (error instanceof DomainException) {
                throw error;
            }
            throw new Error(`Ошибка при синхронизации элементов: ${error}`);
        }
    }

    /**
     * Отзывает доступ пользователя к списку.
     */
    public async revokeListAccess(ownerUserId: string, categoryId: string, targetUserId: string): Promise<void> {
        try {
            const ownerUserIdObj = UserId.create(ownerUserId);
            const categoryIdObj = CategoryId.create(categoryId);
            const targetUserIdObj = UserId.create(targetUserId);
            await this.shoppingListService.revokeListAccess(ownerUserIdObj, categoryIdObj, targetUserIdObj);
        } catch (error) {
            if (error instanceof DomainException) {
                throw error;
            }
            throw new Error(`Ошибка при отзыве доступа: ${error}`);
        }
    }
    
    /**
     * Получает список пользователей с доступом к категории
     */
    public async getUsersWithAccess(userId: string, categoryId: string): Promise<{ id: string, isOwner: boolean }[]> {
        try {
            const userIdObj = UserId.create(userId);
            const categoryIdObj = CategoryId.create(categoryId);
            return await this.shoppingListService.getUsersWithAccess(userIdObj, categoryIdObj);
        } catch (error) {
            if (error instanceof DomainException) {
                throw error;
            }
            throw new Error(`Ошибка при получении списка пользователей с доступом: ${error}`);
        }
    }
} 