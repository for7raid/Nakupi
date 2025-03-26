import { Category } from '../entities/Category';
import { CategoryId } from '../value-objects/CategoryId';
import { UserId } from '../value-objects/UserId';

/**
 * Интерфейс репозитория для работы с категориями.
 * Определяет методы для сохранения и получения категорий.
 */
export interface ICategoryRepository {
    /**
     * Сохраняет категорию в хранилище.
     */
    save(category: Category): Promise<void>;
    
    /**
     * Находит категорию по идентификатору.
     */
    findById(id: CategoryId): Promise<Category | null>;
    
    /**
     * Находит категории по идентификатору пользователя.
     */
    findByUserId(userId: UserId): Promise<Category[]>;
    
    /**
     * Находит категорию по идентификатору пользователя и названию.
     */
    findByUserIdAndName(userId: UserId, name: string): Promise<Category | null>;
    
    /**
     * Удаляет категорию по идентификатору.
     */
    remove(id: CategoryId): Promise<void>;
    
    /**
     * Сохраняет код доступа для категории.
     */
    saveShareCode(categoryId: CategoryId, shareCode: string, expiresAt: Date): Promise<void>;
    
    /**
     * Находит категорию по коду доступа.
     */
    findByShareCode(shareCode: string): Promise<Category | null>;

    /**
     * Получает время истечения кода доступа для категории.
     */
    getShareCodeExpiry(categoryId: CategoryId): Promise<Date | null>;
} 