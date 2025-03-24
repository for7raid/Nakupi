import { ObjectId } from 'mongodb';
import { ItemRepository } from '../ItemRepository';
import { MongoConnection } from '../../database/MongoConnection';
import { ShoppingListItem } from '../../../domain/models/ShoppingListItem';
import { MongoClient } from 'mongodb';
import { config } from '../../../config/config';
import logger from '../../../infrastructure/logging/Logger';

// Мокаем MongoConnection
jest.mock('../../database/MongoConnection');

describe('ItemRepository', () => {
    let itemRepository: ItemRepository;
    let mockMongoClient: jest.Mocked<MongoClient>;
    let mockCollection: any;

    beforeEach(() => {
        // Создаем мок коллекции
        mockCollection = {
            insertOne: jest.fn(),
            find: jest.fn(),
            deleteOne: jest.fn(),
            deleteMany: jest.fn(),
            updateOne: jest.fn()
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

        itemRepository = new ItemRepository();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('addItem', () => {
        it('должен успешно добавить элемент', async () => {
            const item: ShoppingListItem = {
                id: '1',
                userId: 'user1',
                categoryId: 'cat1',
                name: 'Test Item',
                quantity: 1,
                purchased: false
            };

            const mockResult = {
                acknowledged: true,
                insertedId: new ObjectId('507f1f77bcf86cd799439011')
            };

            mockCollection.insertOne.mockResolvedValue(mockResult);

            const result = await itemRepository.addItem(item);

            expect(mockCollection.insertOne).toHaveBeenCalledWith(item);
            expect(result).toEqual({
                ...item,
                id: mockResult.insertedId.toString()
            });
        });

        it('должен выбросить ошибку при неудачном добавлении', async () => {
            const item: ShoppingListItem = {
                id: '1',
                userId: 'user1',
                categoryId: 'cat1',
                name: 'Test Item',
                quantity: 1,
                purchased: false
            };

            mockCollection.insertOne.mockResolvedValue({ acknowledged: false });

            await expect(itemRepository.addItem(item)).rejects.toThrow('Не удалось добавить элемент');
        });
    });

    describe('getItems', () => {
        it('должен успешно получить все элементы пользователя', async () => {
            const userId = 'user1';
            const mockItems = [
                {
                    _id: new ObjectId('507f1f77bcf86cd799439011'),
                    userId: 'user1',
                    categoryId: 'cat1',
                    name: 'Test Item',
                    quantity: 1,
                    purchased: false
                }
            ];

            const mockCursor = {
                toArray: jest.fn().mockResolvedValue(mockItems)
            };

            mockCollection.find.mockReturnValue(mockCursor);

            const result = await itemRepository.getItems(userId);

            expect(mockCollection.find).toHaveBeenCalledWith({ userId });
            expect(result).toEqual(mockItems.map(item => ({
                id: item._id.toString(),
                userId: item.userId,
                categoryId: item.categoryId,
                name: item.name,
                quantity: item.quantity,
                purchased: item.purchased
            })));
        });

        it('должен успешно получить элементы по категории', async () => {
            const userId = 'user1';
            const categoryId = 'cat1';
            const mockItems = [
                {
                    _id: new ObjectId('507f1f77bcf86cd799439011'),
                    userId: 'user1',
                    categoryId: 'cat1',
                    name: 'Test Item',
                    quantity: 1,
                    purchased: false
                }
            ];

            const mockCursor = {
                toArray: jest.fn().mockResolvedValue(mockItems)
            };

            mockCollection.find.mockReturnValue(mockCursor);

            const result = await itemRepository.getItems(userId, categoryId);

            expect(mockCollection.find).toHaveBeenCalledWith({ userId, categoryId });
            expect(result).toEqual(mockItems.map(item => ({
                id: item._id.toString(),
                userId: item.userId,
                categoryId: item.categoryId,
                name: item.name,
                quantity: item.quantity,
                purchased: item.purchased
            })));
        });
    });

    describe('removeItem', () => {
        it('должен успешно удалить элемент', async () => {
            const itemId = '507f1f77bcf86cd799439011';
            const mockResult = {
                acknowledged: true,
                deletedCount: 1
            };

            mockCollection.deleteOne.mockResolvedValue(mockResult);

            await itemRepository.removeItem(itemId);

            expect(mockCollection.deleteOne).toHaveBeenCalledWith(
                itemId.length === 24 ? { _id: new ObjectId(itemId) } : { id: itemId }
            );
        });

        it('должен выбросить ошибку при неудачном удалении', async () => {
            const itemId = '507f1f77bcf86cd799439011';
            const mockResult = {
                acknowledged: false,
                deletedCount: 0
            };

            mockCollection.deleteOne.mockResolvedValue(mockResult);

            await expect(itemRepository.removeItem(itemId)).rejects.toThrow('Не удалось удалить элемент');
        });
    });

    describe('removeItemsByCategory', () => {
        it('должен успешно удалить все элементы категории', async () => {
            const categoryId = 'cat1';
            const mockResult = {
                acknowledged: true,
                deletedCount: 2
            };

            mockCollection.deleteMany.mockResolvedValue(mockResult);

            await itemRepository.removeItemsByCategory(categoryId);

            expect(mockCollection.deleteMany).toHaveBeenCalledWith({ categoryId });
        });

        it('должен выбросить ошибку при неудачном удалении', async () => {
            const categoryId = 'cat1';
            const mockResult = {
                acknowledged: false
            };

            mockCollection.deleteMany.mockResolvedValue(mockResult);

            await expect(itemRepository.removeItemsByCategory(categoryId)).rejects.toThrow('Не удалось удалить элементы категории');
        });
    });

    describe('markAsPurchased', () => {
        it('должен успешно отметить элемент как купленный', async () => {
            const itemId = '507f1f77bcf86cd799439011';
            const mockResult = {
                acknowledged: true,
                modifiedCount: 1
            };

            mockCollection.updateOne.mockResolvedValue(mockResult);

            await itemRepository.markAsPurchased(itemId);

            expect(mockCollection.updateOne).toHaveBeenCalledWith(
                itemId.length === 24 ? { _id: new ObjectId(itemId) } : { id: itemId },
                { $set: { purchased: true } }
            );
        });

        it('должен выбросить ошибку при неудачном обновлении', async () => {
            const itemId = '507f1f77bcf86cd799439011';
            const mockResult = {
                acknowledged: false,
                modifiedCount: 0
            };

            mockCollection.updateOne.mockResolvedValue(mockResult);

            await expect(itemRepository.markAsPurchased(itemId)).rejects.toThrow('Не удалось отметить элемент как купленный');
        });
    });

    describe('markAsNotPurchased', () => {
        it('должен успешно отметить элемент как не купленный', async () => {
            const itemId = '507f1f77bcf86cd799439011';
            const mockResult = {
                acknowledged: true,
                modifiedCount: 1
            };

            mockCollection.updateOne.mockResolvedValue(mockResult);

            await itemRepository.markAsNotPurchased(itemId);

            expect(mockCollection.updateOne).toHaveBeenCalledWith(
                itemId.length === 24 ? { _id: new ObjectId(itemId) } : { id: itemId },
                { $set: { purchased: false } }
            );
        });

        it('должен выбросить ошибку при неудачном обновлении', async () => {
            const itemId = '507f1f77bcf86cd799439011';
            const mockResult = {
                acknowledged: false,
                modifiedCount: 0
            };

            mockCollection.updateOne.mockResolvedValue(mockResult);

            await expect(itemRepository.markAsNotPurchased(itemId)).rejects.toThrow('Не удалось отметить элемент как не купленный');
        });
    });
}); 