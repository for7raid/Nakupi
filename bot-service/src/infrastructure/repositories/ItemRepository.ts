import { ObjectId } from 'mongodb';
import { ShoppingListItem } from '../../domain/models/ShoppingListItem';
import { BaseRepository } from './BaseRepository';
import logger from '../logging/Logger';
import metricsService from '../monitoring';
import { IItemRepository } from '../../domain/intefaces/IItemRepository';

/**
 * Реализация репозитория для работы с элементами списка покупок
 */
export class ItemRepository extends BaseRepository<ShoppingListItem & { _id?: ObjectId }> implements IItemRepository {
    constructor() {
        super('items');
    }

    /**
     * Добавляет новый элемент в список покупок
     */
    async addItem(item: ShoppingListItem): Promise<ShoppingListItem> {
        try {
            const newItem = await this.create(item);
            
            // Преобразуем _id MongoDB в id для клиентского API
            const { _id, ...rest } = newItem;
            return {
                ...rest,
                id: _id ? _id.toString() : undefined
            };
        } catch (error) {
            this.handleError('Ошибка при добавлении элемента списка покупок', error);
            throw error instanceof Error 
                ? error 
                : new Error('Не удалось добавить элемент списка покупок');
        }
    }

    /**
     * Удаляет элемент из списка покупок
     */
    async removeItem(itemId: string): Promise<void> {
        try {
            const isValidObjectId = itemId.length === 24;
            let success: boolean;
            
            if (isValidObjectId) {
                success = await this.delete(itemId);
            } else {
                // Для случаев, когда id не является ObjectId MongoDB
                const result = await this.collection.deleteOne({ id: itemId });
                success = result.deletedCount > 0;
            }
            
            if (!success) {
                throw new Error(`Не удалось удалить элемент с ID ${itemId}`);
            }
        } catch (error) {
            this.handleError('Ошибка при удалении элемента списка покупок', error);
            throw error;
        }
    }

    /**
     * Получает список элементов для указанного пользователя и категории
     */
    async getItems(userId: string, categoryId?: string): Promise<ShoppingListItem[]> {
        try {
            const query: any = { userId };
            
            if (categoryId) {
                query.categoryId = categoryId;
            }
            
            const items = await this.find(query);
            
            // Нормализуем формат id для клиентского API
            return items.map(item => {
                const { _id, ...rest } = item as (ShoppingListItem & { _id?: ObjectId });
                return {
                    ...rest,
                    id: _id ? _id.toString() : rest.id
                };
            });
        } catch (error) {
            this.handleError('Ошибка при получении элементов списка покупок', error);
            throw error;
        }
    }

    /**
     * Удаляет все элементы указанной категории
     */
    async removeItemsByCategory(categoryId: string): Promise<void> {
        try {
            const deletedCount = await this.deleteMany({ categoryId });
            logger.info(`Удалено ${deletedCount} элементов из категории ${categoryId}`);
        } catch (error) {
            this.handleError('Ошибка при удалении элементов категории', error);
            throw error;
        }
    }

    /**
     * Отмечает элемент как купленный
     */
    async markAsPurchased(itemId: string): Promise<void> {
        try {
            const isValidObjectId = itemId.length === 24;
            const filter = isValidObjectId 
                ? { _id: new ObjectId(itemId) } 
                : { id: itemId };
            
            const result = await this.collection.updateOne(
                filter,
                { 
                    $set: { 
                        purchased: true,
                        purchasedDate: new Date()
                    } 
                }
            );
            
            if (!result.acknowledged || result.matchedCount === 0) {
                throw new Error(`Не удалось отметить элемент ${itemId} как купленный`);
            }
            
            logger.info(`Элемент ${itemId} отмечен как купленный`);
        } catch (error) {
            this.handleError('Ошибка при отметке элемента как купленного', error);
            throw error;
        }
    }

    /**
     * Отмечает элемент как не купленный
     */
    async markAsNotPurchased(itemId: string): Promise<void> {
        try {
            const isValidObjectId = itemId.length === 24;
            const filter = isValidObjectId 
                ? { _id: new ObjectId(itemId) } 
                : { id: itemId };
            
            const result = await this.collection.updateOne(
                filter,
                { 
                    $set: { purchased: false },
                    $unset: { purchasedDate: "" }
                }
            );
            
            if (!result.acknowledged || result.matchedCount === 0) {
                throw new Error(`Не удалось отметить элемент ${itemId} как не купленный`);
            }
            
            logger.info(`Элемент ${itemId} отмечен как не купленный`);
        } catch (error) {
            this.handleError('Ошибка при отметке элемента как не купленного', error);
            throw error;
        }
    }

    /**
     * Обновляет количество элемента
     */
    async updateItemQuantity(itemId: string, quantity: number): Promise<void> {
        try {
            const isValidObjectId = itemId.length === 24;
            const filter = isValidObjectId 
                ? { _id: new ObjectId(itemId) } 
                : { id: itemId };
            
            const result = await this.collection.updateOne(
                filter,
                { $set: { quantity } }
            );
            
            if (!result.acknowledged || result.matchedCount === 0) {
                throw new Error(`Не удалось обновить количество элемента ${itemId}`);
            }
            
            logger.info(`Обновлено количество элемента ${itemId}: ${quantity}`);
        } catch (error) {
            this.handleError('Ошибка при обновлении количества элемента', error);
            throw error;
        }
    }
} 