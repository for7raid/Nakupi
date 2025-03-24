import { ICategoryRepository } from '../../domain/intefaces/ICategoryRepository';
import { IItemRepository } from '../../domain/intefaces/IItemRepository';
import { Category } from '../../domain/models/Category';
import { Validator } from '../validation/Validator';
import logger from '../../infrastructure/logging/Logger';

/**
 * Сервис для работы с категориями списка покупок
 */
export class CategoryService {
    constructor(
        private categoryRepository: ICategoryRepository,
        private itemRepository: IItemRepository
    ) {}

    /**
     * Добавляет новую категорию
     */
    public async addCategory(category: Category): Promise<Category> {
        try {
            if (!Validator.validateCategory(category)) {
                const error = new Error('Невалидная категория');
                logger.error('Ошибка валидации категории', { category });
                throw error;
            }
            
            const newCategory = await this.categoryRepository.addCategory(category);
            logger.info('Добавлена новая категория', { 
                categoryName: category.name, 
                userId: category.userId 
            });
            
            return newCategory;
        } catch (error) {
            logger.error('Ошибка при добавлении категории:', error);
            throw error;
        }
    }

    /**
     * Получает список категорий пользователя
     */
    public async getCategories(userId: string): Promise<Category[]> {
        try {
            if (!userId) {
                const error = new Error('Идентификатор пользователя не указан');
                logger.error('Ошибка валидации идентификатора пользователя');
                throw error;
            }
            
            const categories = await this.categoryRepository.getCategories(userId);
            logger.debug('Получены категории пользователя', { 
                userId, 
                count: categories.length 
            });
            
            return categories;
        } catch (error) {
            logger.error('Ошибка при получении категорий:', error);
            throw error;
        }
    }

    /**
     * Удаляет категорию и все её элементы
     */
    public async removeCategory(id: string): Promise<void> {
        try {
            if (!id) {
                const error = new Error('Идентификатор категории не указан');
                logger.error('Ошибка валидации идентификатора категории');
                throw error;
            }
            
            // Сначала удаляем все элементы данной категории
            await this.itemRepository.removeItemsByCategory(id);
            logger.debug('Удалены все элементы категории', { categoryId: id });
            
            // Затем удаляем саму категорию
            await this.categoryRepository.removeCategory(id);
            logger.info('Удалена категория', { categoryId: id });
        } catch (error) {
            logger.error('Ошибка при удалении категории:', error);
            throw error;
        }
    }
} 