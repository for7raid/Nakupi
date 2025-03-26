import { jest, describe, expect, it, beforeEach, afterEach } from '@jest/globals';
import { Collection } from 'mongodb';
import { MongoItemRepository } from '../MongoItemRepository';
import { ShoppingListItem } from '../../../domain/entities/ShoppingListItem';
import { ItemId } from '../../../domain/value-objects/ItemId';
import { UserId } from '../../../domain/value-objects/UserId';
import { CategoryId } from '../../../domain/value-objects/CategoryId';
import { Quantity } from '../../../domain/value-objects/Quantity';

describe('MongoItemRepository', () => {
    let mongoItemRepository: MongoItemRepository;
    let mockCollection: any;
    let mockCursor: any;

    const userId = UserId.fromString('user123');
    const categoryId = CategoryId.fromString('cat123');
    const itemId = ItemId.fromString('item123');
    const quantity = new Quantity(2, 'шт');
    
    // Создаем элемент списка с нужными параметрами
    const item = new ShoppingListItem(
        userId,
        categoryId, 
        'Test Item',
        quantity,
        false,
        null,
        itemId
    );

    beforeEach(() => {
        // Создаем мок курсора для операций find
        mockCursor = {
            toArray: jest.fn()
        };

        // Создаем моки MongoDB
        mockCollection = {
            findOne: jest.fn(),
            find: jest.fn().mockReturnValue(mockCursor),
            insertOne: jest.fn(),
            updateOne: jest.fn(),
            deleteOne: jest.fn(),
            deleteMany: jest.fn(),
        };

        // Подменяем метод, который получает доступ к коллекции MongoDB
        jest.spyOn(MongoItemRepository.prototype as any, 'getCollection')
            .mockResolvedValue(mockCollection);

        // Создаем экземпляр репозитория
        mongoItemRepository = new MongoItemRepository();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('save', () => {
        it('должен сохранить элемент списка в MongoDB', async () => {
            // Вызов метода
            await mongoItemRepository.save(item);

            // Проверка вызова методов
            expect(mockCollection.updateOne).toHaveBeenCalledWith(
                { itemId: expect.any(String) },
                { $set: expect.objectContaining({
                    itemId: expect.any(String),
                    name: 'Test Item',
                    userId: 'user123',
                    categoryId: 'cat123',
                    quantity: 2
                })},
                { upsert: true }
            );
        });
    });

    describe('findById', () => {
        it('должен вернуть элемент списка, если он существует', async () => {
            // Настройка моков
            mockCollection.findOne.mockResolvedValueOnce({
                itemId: itemId.value,
                name: 'Test Item',
                userId: userId.value,
                categoryId: categoryId.value,
                quantity: 2
                purchased: false,
                purchasedDate: null,
                createdAt: new Date().toISOString(),
                updatedAt: null
            });

            // Вызов метода
            const result = await mongoItemRepository.findById(itemId);

            // Проверка результата
            expect(mockCollection.findOne).toHaveBeenCalledWith({ itemId: itemId.value });
            expect(result).toBeDefined();
            expect(result?.id.value).toBe(itemId.value);
            expect(result?.name).toBe('Test Item');
            expect(result?.quantity.value).toBe(2);
        });

        it('должен вернуть null, если элемент списка не существует', async () => {
            // Настройка моков
            mockCollection.findOne.mockResolvedValueOnce(null);

            // Вызов метода
            const result = await mongoItemRepository.findById(itemId);

            // Проверка результата
            expect(mockCollection.findOne).toHaveBeenCalledWith({ itemId: itemId.value });
            expect(result).toBeNull();
        });
    });

    describe('findByUserId', () => {
        it('должен вернуть все элементы списка пользователя', async () => {
            // Настройка моков
            const mockItemsDto = [
                {
                    itemId: 'item1',
                    name: 'Item 1',
                    userId: userId.value,
                    categoryId: categoryId.value,
                    quantity: 2,
                    purchased: false,
                    purchasedDate: null,
                    createdAt: new Date().toISOString(),
                    updatedAt: null
                },
                {
                    itemId: 'item2',
                    name: 'Item 2',
                    userId: userId.value,
                    categoryId: categoryId.value,
                    quantity: 1,
                    purchased: true,
                    purchasedDate: new Date().toISOString(),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ];
            
            mockCursor.toArray.mockResolvedValueOnce(mockItemsDto);

            // Вызов метода
            const result = await mongoItemRepository.findByUserId(userId);

            // Проверка результата
            expect(mockCollection.find).toHaveBeenCalledWith({ userId: userId.value });
            expect(mockCursor.toArray).toHaveBeenCalled();
            expect(result.length).toBe(2);
            expect(result[0].id.value).toBe('item1');
            expect(result[0].name).toBe('Item 1');
            expect(result[0].quantity.value).toBe(2);
            expect(result[1].id.value).toBe('item2');
            expect(result[1].name).toBe('Item 2');
            expect(result[1].purchased).toBe(true);
        });

        it('должен вернуть пустой массив, если у пользователя нет элементов списка', async () => {
            // Настройка моков
            mockCursor.toArray.mockResolvedValueOnce([]);

            // Вызов метода
            const result = await mongoItemRepository.findByUserId(userId);

            // Проверка результата
            expect(mockCollection.find).toHaveBeenCalledWith({ userId: userId.value });
            expect(mockCursor.toArray).toHaveBeenCalled();
            expect(result.length).toBe(0);
        });
    });

    describe('findByUserIdAndCategoryId', () => {
        it('должен вернуть все элементы списка в категории', async () => {
            // Настройка моков
            const mockItemsDto = [
                {
                    itemId: 'item1',
                    name: 'Item 1',
                    userId: userId.value,
                    categoryId: categoryId.value,
                    quantity: 2,
                    purchased: false,
                    purchasedDate: null,
                    createdAt: new Date().toISOString(),
                    updatedAt: null
                }
            ];
            
            mockCursor.toArray.mockResolvedValueOnce(mockItemsDto);

            // Вызов метода
            const result = await mongoItemRepository.findByUserIdAndCategoryId(userId, categoryId);

            // Проверка результата
            expect(mockCollection.find).toHaveBeenCalledWith({ 
                userId: userId.value,
                categoryId: categoryId.value
            });
            expect(mockCursor.toArray).toHaveBeenCalled();
            expect(result.length).toBe(1);
            expect(result[0].id.value).toBe('item1');
            expect(result[0].name).toBe('Item 1');
        });
    });

    describe('findByUserIdAndPurchasedStatus', () => {
        it('должен вернуть все купленные элементы списка пользователя', async () => {
            // Настройка моков
            const mockItemsDto = [
                {
                    itemId: 'item2',
                    name: 'Item 2',
                    userId: userId.value,
                    categoryId: categoryId.value,
                    quantity: 1,
                    purchased: true,
                    purchasedDate: new Date().toISOString(),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ];
            
            mockCursor.toArray.mockResolvedValueOnce(mockItemsDto);

            // Вызов метода
            const result = await mongoItemRepository.findByUserIdAndPurchasedStatus(userId, true);

            // Проверка результата
            expect(mockCollection.find).toHaveBeenCalledWith({ 
                userId: userId.value,
                purchased: true
            });
            expect(mockCursor.toArray).toHaveBeenCalled();
            expect(result.length).toBe(1);
            expect(result[0].id.value).toBe('item2');
            expect(result[0].purchased).toBe(true);
        });
    });

    describe('remove', () => {
        it('должен удалить элемент списка из MongoDB', async () => {
            // Настройка моков
            mockCollection.deleteOne.mockResolvedValueOnce({ deletedCount: 1 });

            // Вызов метода
            await mongoItemRepository.remove(itemId);

            // Проверка вызова методов
            expect(mockCollection.deleteOne).toHaveBeenCalledWith({ itemId: itemId.value });
        });
    });

    describe('removeByCategory', () => {
        it('должен удалить все элементы списка в категории', async () => {
            // Настройка моков
            mockCollection.deleteMany.mockResolvedValueOnce({ deletedCount: 2 });

            // Вызов метода
            await mongoItemRepository.removeByCategory(categoryId);

            // Проверка вызова методов
            expect(mockCollection.deleteMany).toHaveBeenCalledWith({ categoryId: categoryId.value });
        });
    });
}); 