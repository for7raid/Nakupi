import { jest, describe, expect, it, beforeEach, afterEach } from '@jest/globals';

import { MongoUserRepository } from '../MongoUserRepository';
import { User } from '../../../domain/entities/User';
import { UserId } from '../../../domain/value-objects/UserId';
import { Db, Collection } from 'mongodb';

describe('MongoUserRepository', () => {
    let mongoUserRepository: MongoUserRepository;
    let mockDb: jest.Mocked<Db>;
    let mockCollection: jest.Mocked<Collection>;
    let mockCursor: any;

    const userId = UserId.fromString('123456789');
    const user = User.create(userId, 'Test User');

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
        } as unknown as jest.Mocked<Collection>;

        mockDb = {
            collection: jest.fn().mockReturnValue(mockCollection),
        } as unknown as jest.Mocked<Db>;

        // Подменяем метод, который получает доступ к коллекции MongoDB
        jest.spyOn(MongoUserRepository.prototype as any, 'getCollection').mockResolvedValue(mockCollection);

        // Создаем экземпляр репозитория без параметров
        mongoUserRepository = new MongoUserRepository();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('save', () => {
        it('должен создать нового пользователя, если его не существует', async () => {
            // Непосредственная подмена методов репозитория для этого теста
            const collectionSpy = jest.spyOn(mongoUserRepository as any, 'getCollection');
            
            // Настройка моков
            mockCollection.findOne.mockResolvedValueOnce(null);
            mockCollection.updateOne.mockResolvedValueOnce({ matchedCount: 0, modifiedCount: 0, upsertedCount: 1 } as any);
            
            // Убеждаемся, что getCollection вернет наш мок
            collectionSpy.mockResolvedValue(mockCollection);

            // Вызов метода
            await mongoUserRepository.save(user);

            // Проверка вызова методов в правильном порядке
            expect(collectionSpy).toHaveBeenCalled(); // Проверяем, что getCollection вызывался
            expect(mockCollection.updateOne).toHaveBeenCalledWith(
                { userId: userId.value },
                { $set: expect.objectContaining({
                    userId: userId.value,
                    name: 'Test User',
                    isActive: true,
                    lastActivityAt: expect.any(Date)
                })},
                { upsert: true }
            );
        });

        it('должен обновить существующего пользователя', async () => {
            // Непосредственная подмена методов репозитория для этого теста
            const collectionSpy = jest.spyOn(mongoUserRepository as any, 'getCollection');
            
            // Настройка моков
            mockCollection.findOne.mockResolvedValueOnce({
                userId: userId.value,
                name: 'Test User',
                isActive: true,
                createdAt: new Date(),
                updatedAt: null,
                lastActivityAt: new Date(),
            });
            mockCollection.updateOne.mockResolvedValueOnce({ matchedCount: 1, modifiedCount: 1 } as any);
            
            // Убеждаемся, что getCollection вернет наш мок
            collectionSpy.mockResolvedValue(mockCollection);

            // Вызов метода
            await mongoUserRepository.save(user);

            // Проверка вызова методов
            expect(collectionSpy).toHaveBeenCalled(); // Проверяем, что getCollection вызывался
            expect(mockCollection.updateOne).toHaveBeenCalledWith(
                { userId: userId.value },
                { $set: expect.objectContaining({
                    userId: userId.value,
                    name: 'Test User',
                    isActive: true,
                    lastActivityAt: expect.any(Date)
                })},
                { upsert: true }
            );
        });
    });

    describe('findById', () => {
        it('должен вернуть пользователя, если он существует', async () => {
            // Настройка моков
            mockCollection.findOne.mockResolvedValueOnce({
                userId: userId.value,
                name: 'Test User',
                isActive: true,
                createdAt: new Date(),
                updatedAt: null,
                lastActivityAt: new Date(),
            });

            // Вызов метода - передаем объект UserId вместо строки
            const result = await mongoUserRepository.findById(userId);

            // Проверка результата
            expect(mockCollection.findOne).toHaveBeenCalledWith({ userId: userId.value });
            expect(result).toBeDefined();
            expect(result?.id.value).toBe(userId.value);
            expect(result?.name).toBe('Test User');
            expect(result?.isActive).toBe(true);
        });

        it('должен вернуть null, если пользователь не существует', async () => {
            // Настройка моков
            mockCollection.findOne.mockResolvedValueOnce(null);

            // Вызов метода - передаем объект UserId вместо строки
            const result = await mongoUserRepository.findById(userId);

            // Проверка результата
            expect(mockCollection.findOne).toHaveBeenCalledWith({ userId: userId.value });
            expect(result).toBeNull();
        });
    });

    describe('findAll', () => {
        it('должен вернуть всех пользователей', async () => {
            // Настройка моков
            const users = [
                {
                    userId: '123456789',
                    name: 'User 1',
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: null,
                    lastActivityAt: new Date(),
                },
                {
                    userId: '987654321',
                    name: 'User 2',
                    isActive: false,
                    createdAt: new Date(),
                    updatedAt: null,
                    lastActivityAt: new Date(),
                }
            ];
            
            // Настраиваем мок курсора для возврата данных
            mockCursor.toArray.mockResolvedValueOnce(users);

            // Вызов метода
            const result = await mongoUserRepository.findAll();

            // Проверка результата
            expect(mockCollection.find).toHaveBeenCalled();
            expect(mockCursor.toArray).toHaveBeenCalled();
            expect(result.length).toBe(2);
            expect(result[0].id.value).toBe('123456789');
            expect(result[0].name).toBe('User 1');
            expect(result[1].id.value).toBe('987654321');
            expect(result[1].name).toBe('User 2');
        });

        it('должен вернуть пустой массив, если нет пользователей', async () => {
            // Настройка моков
            mockCursor.toArray.mockResolvedValueOnce([]);

            // Вызов метода
            const result = await mongoUserRepository.findAll();

            // Проверка результата
            expect(mockCollection.find).toHaveBeenCalled();
            expect(mockCursor.toArray).toHaveBeenCalled();
            expect(result.length).toBe(0);
        });
    });

    describe('findActive', () => {
        it('должен вернуть активных пользователей', async () => {
            // Настройка моков
            const activeUsers = [
                {
                    userId: '123456789',
                    name: 'Active User',
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: null,
                    lastActivityAt: new Date(),
                }
            ];
            
            // Настраиваем мок курсора для возврата данных
            mockCursor.toArray.mockResolvedValueOnce(activeUsers);

            // Вызов метода
            const result = await mongoUserRepository.findActive();

            // Проверка результата
            expect(mockCollection.find).toHaveBeenCalledWith({ isActive: true });
            expect(mockCursor.toArray).toHaveBeenCalled();
            expect(result.length).toBe(1);
            expect(result[0].id.value).toBe('123456789');
            expect(result[0].isActive).toBe(true);
        });
    });
}); 