import { IItemRepository } from '../../domain/intefaces/IItemRepository';
import { ShoppingListItem } from '../../domain/models/ShoppingListItem';
import { Validator } from '../validation/Validator';
import logger from '../../infrastructure/logging/Logger';

/**
 * Сервис для работы с элементами списка покупок
 */
export class ItemService {
    constructor(private itemRepository: IItemRepository) {}

    /**
     * Добавляет новый элемент в список покупок
     */
    public async addItem(item: ShoppingListItem): Promise<ShoppingListItem> {
        try {
            if (!Validator.validateShoppingListItem(item)) {
                const error = new Error('Невалидный элемент списка покупок');
                logger.error('Ошибка валидации элемента списка покупок', { item });
                throw error;
            }
            
            const newItem = await this.itemRepository.addItem(item);
            logger.info('Добавлен новый элемент списка покупок', { 
                itemName: item.name, 
                userId: item.userId,
                categoryId: item.categoryId 
            });
            
            return newItem;
        } catch (error) {
            logger.error('Ошибка при добавлении элемента списка покупок:', error);
            throw error;
        }
    }

    /**
     * Удаляет элемент из списка покупок
     */
    public async removeItem(id: string): Promise<void> {
        try {
            if (!id) {
                const error = new Error('Идентификатор элемента не указан');
                logger.error('Ошибка валидации идентификатора элемента списка покупок');
                throw error;
            }
            
            await this.itemRepository.removeItem(id);
            logger.info('Удален элемент списка покупок', { itemId: id });
        } catch (error) {
            logger.error('Ошибка при удалении элемента списка покупок:', error);
            throw error;
        }
    }

    /**
     * Получает список элементов для указанного пользователя и категории
     */
    public async getItems(userId: string, categoryId?: string): Promise<ShoppingListItem[]> {
        try {
            if (!userId) {
                throw new Error('Идентификатор пользователя не указан');
            }

            const items = await this.itemRepository.getItems(userId, categoryId);
            logger.debug('Получены элементы списка покупок', { 
                userId, 
                categoryId,
                count: items.length 
            });
            
            return items;
        } catch (error) {
            logger.error('Ошибка при получении элементов списка покупок:', error);
            throw error;
        }
    }

    /**
     * Отмечает элемент как купленный
     */
    public async markAsPurchased(id: string): Promise<void> {
        try {
            if (!id) {
                const error = new Error('Идентификатор элемента не указан');
                logger.error('Ошибка валидации идентификатора элемента списка покупок');
                throw error;
            }
            
            await this.itemRepository.markAsPurchased(id);
            logger.info('Элемент отмечен как купленный', { itemId: id });
        } catch (error) {
            logger.error('Ошибка при отметке элемента как купленного:', error);
            throw error;
        }
    }

    /**
     * Отмечает элемент как не купленный
     */
    public async markAsNotPurchased(id: string): Promise<void> {
        try {
            if (!id) {
                const error = new Error('Идентификатор элемента не указан');
                logger.error('Ошибка валидации идентификатора элемента списка покупок');
                throw error;
            }
            
            await this.itemRepository.markAsNotPurchased(id);
            logger.info('Элемент отмечен как не купленный', { itemId: id });
        } catch (error) {
            logger.error('Ошибка при отметке элемента как не купленного:', error);
            throw error;
        }
    }

    /**
     * Обновляет количество элемента
     */
    public async updateItemQuantity(id: string, quantity: number): Promise<void> {
        try {
            if (!id) {
                const error = new Error('Идентификатор элемента не указан');
                logger.error('Ошибка валидации идентификатора элемента списка покупок');
                throw error;
            }
            
            if (quantity < 0) {
                const error = new Error('Количество не может быть отрицательным');
                logger.error('Ошибка валидации количества элемента', { quantity });
                throw error;
            }
            
            await this.itemRepository.updateItemQuantity(id, quantity);
            logger.info('Обновлено количество элемента', { itemId: id, quantity });
        } catch (error) {
            logger.error('Ошибка при обновлении количества элемента:', error);
            throw error;
        }
    }
} 