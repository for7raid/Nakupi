import { jest, describe, expect, it, beforeEach, afterEach } from '@jest/globals';
import { Collection } from 'mongodb';
import { MongoCategoryRepository } from '../MongoCategoryRepository';
import { Category } from '../../../domain/entities/Category';
import { UserId } from '../../../domain/value-objects/UserId';
import { CategoryId } from '../../../domain/value-objects/CategoryId';

describe('MongoCategoryRepository', () => {
    let mongoCategoryRepository: MongoCategoryRepository;
    let mockCollection: any;
    let mockCursor: any;

    const userId = UserId.fromString('user123');
    const categoryId = CategoryId.fromString('cat123');
    const category = Category.create(userId, 'Test Category');

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
        };

        // Подменяем метод, который получает доступ к коллекции MongoDB
        jest.spyOn(MongoCategoryRepository.prototype as any, 'getCollection')
            .mockResolvedValue(mockCollection);

        // Создаем экземпляр репозитория
        mongoCategoryRepository = new MongoCategoryRepository();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('save', () => {
        it('должен сохранить категорию в MongoDB', async () => {
            // Вызов метода
            await mongoCategoryRepository.save(category);

            // Проверка вызова методов
            expect(mockCollection.updateOne).toHaveBeenCalledWith(
                { categoryId: expect.any(String) },
                { $set: expect.objectContaining({
                    categoryId: expect.any(String),
                    name: 'Test Category',
                    userId: 'user123'
                })},
                { upsert: true }
            );
        });
    });

    describe('findById', () => {
        it('должен вернуть категорию, если она существует', async () => {
            // Настройка моков
            mockCollection.findOne.mockResolvedValueOnce({
                categoryId: categoryId.value,
                name: 'Test Category',
                userId: userId.value,
                createdAt: new Date().toISOString(),
                updatedAt: null
            });

            // Вызов метода
            const result = await mongoCategoryRepository.findById(categoryId);

            // Проверка результата
            expect(mockCollection.findOne).toHaveBeenCalledWith({ categoryId: categoryId.value });
            expect(result).toBeDefined();
            expect(result?.id.value).toBe(categoryId.value);
            expect(result?.name).toBe('Test Category');
        });

        it('должен вернуть null, если категория не существует', async () => {
            // Настройка моков
            mockCollection.findOne.mockResolvedValueOnce(null);

            // Вызов метода
            const result = await mongoCategoryRepository.findById(categoryId);

            // Проверка результата
            expect(mockCollection.findOne).toHaveBeenCalledWith({ categoryId: categoryId.value });
            expect(result).toBeNull();
        });
    });

    describe('findByUserId', () => {
        it('должен вернуть все категории пользователя', async () => {
            // Настройка моков
            const mockCategoriesDto = [
                {
                    categoryId: 'cat1',
                    name: 'Category 1',
                    userId: userId.value,
                    createdAt: new Date().toISOString(),
                    updatedAt: null
                },
                {
                    categoryId: 'cat2',
                    name: 'Category 2',
                    userId: userId.value,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ];
            
            mockCursor.toArray.mockResolvedValueOnce(mockCategoriesDto);

            // Вызов метода
            const result = await mongoCategoryRepository.findByUserId(userId);

            // Проверка результата
            expect(mockCollection.find).toHaveBeenCalledWith({ userId: userId.value });
            expect(mockCursor.toArray).toHaveBeenCalled();
            expect(result.length).toBe(2);
            expect(result[0].id.value).toBe('cat1');
            expect(result[0].name).toBe('Category 1');
            expect(result[1].id.value).toBe('cat2');
            expect(result[1].name).toBe('Category 2');
        });

        it('должен вернуть пустой массив, если у пользователя нет категорий', async () => {
            // Настройка моков
            mockCursor.toArray.mockResolvedValueOnce([]);

            // Вызов метода
            const result = await mongoCategoryRepository.findByUserId(userId);

            // Проверка результата
            expect(mockCollection.find).toHaveBeenCalledWith({ userId: userId.value });
            expect(mockCursor.toArray).toHaveBeenCalled();
            expect(result.length).toBe(0);
        });
    });

    describe('remove', () => {
        it('должен удалить категорию из MongoDB', async () => {
            // Настройка моков
            mockCollection.deleteOne.mockResolvedValueOnce({ deletedCount: 1 });

            // Вызов метода
            await mongoCategoryRepository.remove(categoryId);

            // Проверка вызова методов
            expect(mockCollection.deleteOne).toHaveBeenCalledWith({ categoryId: categoryId.value });
        });
    });
}); 