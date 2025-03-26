import { ShoppingListItem } from '../entities/ShoppingListItem';
import { ItemId } from '../value-objects/ItemId';
import { CategoryId } from '../value-objects/CategoryId';
import { UserId } from '../value-objects/UserId';

/**
 * Интерфейс репозитория для работы с элементами списка покупок.
 * Определяет методы для сохранения и получения элементов.
 */
export interface IItemRepository {
    /**
     * Сохраняет элемент в хранилище.
     */
    save(item: ShoppingListItem): Promise<void>;
    
    /**
     * Находит элемент по идентификатору.
     */
    findById(id: ItemId): Promise<ShoppingListItem | null>;
    
    /**
     * Находит элементы по идентификатору пользователя.
     */
    findByUserId(userId: UserId): Promise<ShoppingListItem[]>;
    
    /**
     * Находит элементы по идентификатору пользователя и категории.
     */
    findByUserIdAndCategoryId(userId: UserId, categoryId: CategoryId): Promise<ShoppingListItem[]>;
    
    /**
     * Находит элементы по идентификатору пользователя и статусу "куплено".
     */
    findByUserIdAndPurchasedStatus(userId: UserId, purchased: boolean): Promise<ShoppingListItem[]>;
    
    /**
     * Удаляет элемент по идентификатору.
     */
    remove(id: ItemId): Promise<void>;
    
    /**
     * Удаляет все элементы определенной категории.
     */
    removeByCategory(categoryId: CategoryId): Promise<void>;
    
    /**
     * Находит элементы по идентификатору категории.
     */
    findByCategory(categoryId: CategoryId): Promise<ShoppingListItem[]>;
    
    /**
     * Находит все элементы в хранилище.
     */
    findAll(): Promise<ShoppingListItem[]>;
    
    /**
     * Находит элементы по идентификатору категории.
     */
    findByCategoryId(categoryId: CategoryId): Promise<ShoppingListItem[]>;
    
    update(item: ShoppingListItem): Promise<void>;
    add(item: ShoppingListItem): Promise<void>;
} 