import { ObjectId } from 'mongodb';
import { Category } from '../../domain/models/Category';
import { BaseRepository } from './BaseRepository';
import logger from '../logging/Logger';
import metricsService from '../monitoring/FileMetricsService';
import { ICategoryRepository } from '../../domain/intefaces/ICategoryRepository';

export class CategoryRepository extends BaseRepository<Category> implements ICategoryRepository {
    constructor() {
        super('categories');
    }

    async addCategory(category: Category): Promise<Category> {
        try {
            const result = await this.collection.insertOne(category);
            
            if (!result.acknowledged) {
                throw new Error('Не удалось добавить категорию');
            }

            return {
                ...category,
                id: result.insertedId.toString()
            };
        } catch (error) {
            logger.error('Ошибка при добавлении категории:', error);
            metricsService.incrementError();
            throw error;
        }
    }

    async getCategories(userId: string): Promise<Category[]> {
        try {
            const categories = await this.collection.find({ userId }).toArray();
            
            return categories.map(category => {
                // Преобразуем документ MongoDB в объект приложения
                const { _id, ...rest } = category;
                return {
                    ...rest,
                    id: _id.toString()
                };
            });
        } catch (error) {
            logger.error('Ошибка при получении категорий:', error);
            metricsService.incrementError();
            throw error;
        }
    }

    async removeCategory(categoryId: string): Promise<void> {
        try {
            // В тестах используем обычный id, в продакшене - ObjectId
            const query = categoryId.length === 24 ? { _id: new ObjectId(categoryId) } : { id: categoryId };
            
            const result = await this.collection.deleteOne(query);
            
            if (!result.acknowledged || result.deletedCount === 0) {
                throw new Error('Не удалось удалить категорию');
            }
        } catch (error) {
            logger.error('Ошибка при удалении категории:', error);
            metricsService.incrementError();
            throw error;
        }
    }

    async create(category: Category): Promise<Category> {
        try {
            const result = await this.collection.insertOne(category);
            logger.info('Категория создана', { categoryId: result.insertedId });
            return category;
        } catch (error) {
            logger.error('Ошибка при создании категории:', error);
            metricsService.incrementError();
            throw error;
        }
    }

    async findById(id: string): Promise<Category | null> {
        try {
            return await this.collection.findOne({ _id: new ObjectId(id) });
        } catch (error) {
            logger.error('Ошибка при поиске категории:', error);
            metricsService.incrementError();
            throw error;
        }
    }

    async findByUserId(userId: string): Promise<Category[]> {
        try {
            return await this.collection.find({ userId }).toArray();
        } catch (error) {
            logger.error('Ошибка при поиске категорий пользователя:', error);
            metricsService.incrementError();
            throw error;
        }
    }

    async update(id: string, category: Partial<Category>): Promise<Category | null> {
        try {
            const result = await this.collection.findOneAndUpdate(
                { _id: new ObjectId(id) },
                { $set: category },
                { returnDocument: 'after' }
            );
            return result;
        } catch (error) {
            logger.error('Ошибка при обновлении категории:', error);
            metricsService.incrementError();
            throw error;
        }
    }

    async delete(id: string): Promise<boolean> {
        try {
            const result = await this.collection.deleteOne({ _id: new ObjectId(id) });
            return result.deletedCount > 0;
        } catch (error) {
            logger.error('Ошибка при удалении категории:', error);
            metricsService.incrementError();
            throw error;
        }
    }
} 