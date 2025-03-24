import { ObjectId } from 'mongodb';
import { CategoryRepository } from '../CategoryRepository';
import { MongoConnection } from '../../database/MongoConnection';
import { Category } from '../../../domain/models/Category';
import { MongoClient } from 'mongodb';
import { config } from '../../../config/config';
import logger from '../../../infrastructure/logging/Logger';

// Мокаем MongoConnection
jest.mock('../../database/MongoConnection');

describe('CategoryRepository', () => {
    let categoryRepository: CategoryRepository;
    let mockMongoClient: jest.Mocked<MongoClient>;
    let mockCollection: any;

    beforeEach(() => {
        // Создаем мок коллекции
        mockCollection = {
            insertOne: jest.fn(),
            find: jest.fn(),
            deleteOne: jest.fn()
        };

        // Создаем мок клиента MongoDB
        mockMongoClient = {
            db: jest.fn().mockReturnValue({
                collection: jest.fn().mockReturnValue(mockCollection)
            })
        } as any;

        // Настраиваем мок MongoConnection
        (MongoConnection.getInstance as jest.Mock).mockReturnValue({
            getClient: jest.fn().mockReturnValue(mockMongoClient),
            getDatabase: jest.fn().mockReturnValue(mockMongoClient.db())
        });

        // Создаем экземпляр репозитория
        categoryRepository = new CategoryRepository();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('addCategory', () => {
        it('должен успешно добавить категорию', async () => {
            const category: Category = {
                id: '1',
                userId: 'user1',
                name: 'Test Category'
            };

            const mockResult = {
                acknowledged: true,
                insertedId: new ObjectId('507f1f77bcf86cd799439011')
            };

            mockCollection.insertOne.mockResolvedValue(mockResult);

            const result = await categoryRepository.addCategory(category);

            expect(mockCollection.insertOne).toHaveBeenCalledWith(category);
            expect(result).toEqual({
                id: mockResult.insertedId.toString(),
                userId: category.userId,
                name: category.name
            });
        });

        it('должен выбросить ошибку при неудачном добавлении', async () => {
            const category: Category = {
                id: '1',
                userId: 'user1',
                name: 'Test Category'
            };

            mockCollection.insertOne.mockResolvedValue({ acknowledged: false });

            await expect(categoryRepository.addCategory(category)).rejects.toThrow('Не удалось добавить категорию');
        });
    });

    describe('getCategories', () => {
        it('должен успешно получить категории пользователя', async () => {
            const userId = 'user1';
            const mockCategories = [
                {
                    _id: new ObjectId('507f1f77bcf86cd799439011'),
                    userId: 'user1',
                    name: 'Test Category'
                }
            ];

            const mockCursor = {
                toArray: jest.fn().mockResolvedValue(mockCategories)
            };

            mockCollection.find.mockReturnValue(mockCursor);

            const result = await categoryRepository.getCategories(userId);

            expect(mockCollection.find).toHaveBeenCalledWith({ userId });
            expect(result).toEqual(mockCategories.map(category => ({
                id: category._id.toString(),
                userId: category.userId,
                name: category.name
            })));
        });
    });

    describe('removeCategory', () => {
        it('должен успешно удалить категорию', async () => {
            const categoryId = '507f1f77bcf86cd799439011';
            const mockResult = {
                acknowledged: true,
                deletedCount: 1
            };

            mockCollection.deleteOne.mockResolvedValue(mockResult);

            await categoryRepository.removeCategory(categoryId);

            expect(mockCollection.deleteOne).toHaveBeenCalledWith(
                categoryId.length === 24 ? { _id: new ObjectId(categoryId) } : { id: categoryId }
            );
        });

        it('должен выбросить ошибку при неудачном удалении', async () => {
            const categoryId = '507f1f77bcf86cd799439011';
            const mockResult = {
                acknowledged: false,
                deletedCount: 0
            };

            mockCollection.deleteOne.mockResolvedValue(mockResult);

            await expect(categoryRepository.removeCategory(categoryId)).rejects.toThrow('Не удалось удалить категорию');
        });
    });
}); 