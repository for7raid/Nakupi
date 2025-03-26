import { Collection, Document } from 'mongodb';
import { IUserAccessRepository } from '../../domain/repositories/IUserAccessRepository';
import { CategoryId } from '../../domain/value-objects/CategoryId';
import { UserId } from '../../domain/value-objects/UserId';
import { MongoConnection } from '../database/MongoConnection';
import logger from '../logging/Logger';

/**
 * MongoDB-реализация репозитория для управления доступом к спискам.
 */
export class MongoUserAccessRepository implements IUserAccessRepository {
    private static readonly COLLECTION_NAME = 'user_access';
    private connection: MongoConnection;

    constructor() {
        this.connection = MongoConnection.getInstance();
    }

    /**
     * Получает коллекцию доступов пользователей.
     */
    private async getCollection(): Promise<Collection<Document>> {
        return this.connection.getCollection(MongoUserAccessRepository.COLLECTION_NAME);
    }

    /**
     * Предоставляет доступ пользователю к категории.
     */
    public async grantAccess(userId: UserId, categoryId: CategoryId): Promise<void> {
        try {
            const collection = await this.getCollection();
            
            // Проверяем, существует ли уже запись о доступе
            const existingAccess = await collection.findOne({
                userId: userId.value,
                categoryId: categoryId.value
            });

            if (!existingAccess) {
                // Создаем новую запись о доступе
                await collection.insertOne({
                    userId: userId.value,
                    categoryId: categoryId.value,
                    grantedAt: new Date()
                });
                logger.info(`Доступ предоставлен пользователю ${userId} к категории ${categoryId}`);
            } else {
                logger.info(`Доступ уже существует для пользователя ${userId} к категории ${categoryId}`);
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
            logger.error('Ошибка при предоставлении доступа:', error);
            throw new Error(`Не удалось предоставить доступ: ${errorMessage}`);
        }
    }

    /**
     * Отзывает у пользователя доступ к категории.
     */
    public async revokeAccess(userId: UserId, categoryId: CategoryId): Promise<void> {
        try {
            const collection = await this.getCollection();
            
            await collection.deleteOne({
                userId: userId.value,
                categoryId: categoryId.value
            });
            logger.info(`Доступ отозван у пользователя ${userId} к категории ${categoryId}`);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
            logger.error('Ошибка при отзыве доступа:', error);
            throw new Error(`Не удалось отозвать доступ: ${errorMessage}`);
        }
    }

    /**
     * Проверяет, имеет ли пользователь доступ к категории.
     */
    public async hasAccess(userId: UserId, categoryId: CategoryId): Promise<boolean> {
        try {
            const collection = await this.getCollection();
            
            const access = await collection.findOne({
                userId: userId.value,
                categoryId: categoryId.value
            });
            return !!access;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
            logger.error('Ошибка при проверке доступа:', error);
            throw new Error(`Не удалось проверить доступ: ${errorMessage}`);
        }
    }

    /**
     * Находит идентификаторы категорий, к которым у пользователя есть доступ.
     */
    public async findCategoryIdsByUserId(userId: UserId): Promise<CategoryId[]> {
        try {
            const collection = await this.getCollection();
            
            const accesses = await collection.find({
                userId: userId.value
            }).toArray();
            
            return accesses.map(access => CategoryId.create(access.categoryId));
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
            logger.error('Ошибка при поиске категорий пользователя:', error);
            throw new Error(`Не удалось найти категории: ${errorMessage}`);
        }
    }

    /**
     * Находит идентификаторы пользователей, имеющих доступ к категории.
     */
    public async findUserIdsByCategoryId(categoryId: CategoryId): Promise<UserId[]> {
        try {
            const collection = await this.getCollection();
            
            const accesses = await collection.find({
                categoryId: categoryId.value
            }).toArray();
            
            return accesses.map(access => UserId.create(access.userId));
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
            logger.error('Ошибка при поиске пользователей категории:', error);
            throw new Error(`Не удалось найти пользователей: ${errorMessage}`);
        }
    }
} 