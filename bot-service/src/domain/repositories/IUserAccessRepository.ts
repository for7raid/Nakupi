import { CategoryId } from '../value-objects/CategoryId';
import { UserId } from '../value-objects/UserId';

/**
 * Интерфейс репозитория для работы с доступом пользователей к спискам.
 */
export interface IUserAccessRepository {
    /**
     * Предоставляет доступ пользователю к категории.
     */
    grantAccess(userId: UserId, categoryId: CategoryId): Promise<void>;
    
    /**
     * Удаляет доступ пользователя к категории.
     */
    revokeAccess(userId: UserId, categoryId: CategoryId): Promise<void>;
    
    /**
     * Проверяет, имеет ли пользователь доступ к категории.
     */
    hasAccess(userId: UserId, categoryId: CategoryId): Promise<boolean>;
    
    /**
     * Находит идентификаторы категорий, к которым у пользователя есть доступ.
     */
    findCategoryIdsByUserId(userId: UserId): Promise<CategoryId[]>;
    
    /**
     * Находит идентификаторы пользователей, имеющих доступ к категории.
     */
    findUserIdsByCategoryId(categoryId: CategoryId): Promise<UserId[]>;
} 