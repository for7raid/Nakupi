import { MongoClient, ObjectId } from 'mongodb';
import { UserRepository } from '../UserRepository';
import { MongoConnection } from '../../database/MongoConnection';
import { User } from '../../../domain/models/User';
import { config } from '../../../config/config';
import logger from '../../../infrastructure/logging/Logger';

// Мокаем MongoConnection
jest.mock('../../database/MongoConnection');

describe('UserRepository', () => {
    let userRepository: UserRepository;
    let mockMongoClient: jest.Mocked<MongoClient>;
    let mockCollection: any;

    beforeEach(() => {
        // Создаем мок коллекции
        mockCollection = {
            insertOne: jest.fn(),
            findOne: jest.fn(),
            updateOne: jest.fn(),
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
        userRepository = new UserRepository();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('addUser', () => {
        it('должен успешно добавить пользователя', async () => {
            const user: User = {
                id: '123',
                name: 'Test User'
            };

            const mockResult = {
                acknowledged: true,
                insertedId: new ObjectId('507f1f77bcf86cd799439011')
            };

            mockCollection.insertOne.mockResolvedValue(mockResult);

            const result = await userRepository.addUser(user);

            expect(mockCollection.insertOne).toHaveBeenCalledWith(user);
            expect(result).toEqual({
                ...user,
                id: mockResult.insertedId.toString()
            });
        });

        it('должен выбросить ошибку при неудачном добавлении', async () => {
            const user: User = {
                id: '123',
                name: 'Test User'
            };

            mockCollection.insertOne.mockResolvedValue({ acknowledged: false });

            await expect(userRepository.addUser(user)).rejects.toThrow('Не удалось создать пользователя');
        });
    });

    describe('getUserById', () => {
        it('должен успешно получить пользователя', async () => {
            const userId = '123';
            const mockUser = {
                _id: new ObjectId('507f1f77bcf86cd799439011'),
                id: userId,
                name: 'Test User'
            };

            mockCollection.findOne.mockResolvedValue(mockUser);

            const result = await userRepository.getUserById(userId);

            expect(mockCollection.findOne).toHaveBeenCalledWith({ id: userId });
            expect(result).toEqual(mockUser);
        });

        it('должен вернуть null если пользователь не найден', async () => {
            const userId = '123';
            mockCollection.findOne.mockResolvedValue(null);

            const result = await userRepository.getUserById(userId);

            expect(result).toBeNull();
        });
    });

    describe('updateUser', () => {
        it('должен успешно обновить пользователя', async () => {
            const user: User = {
                id: '123',
                name: 'Updated User'
            };

            const mockResult = {
                acknowledged: true,
                modifiedCount: 1
            };

            mockCollection.updateOne.mockResolvedValue(mockResult);

            const result = await userRepository.updateUser(user);

            expect(mockCollection.updateOne).toHaveBeenCalledWith(
                { id: user.id },
                { $set: { name: user.name } }
            );
            expect(result).toEqual(user);
        });

        it('должен выбросить ошибку если пользователь не найден', async () => {
            const user: User = {
                id: '123',
                name: 'Updated User'
            };

            const mockResult = {
                acknowledged: true,
                modifiedCount: 0
            };

            mockCollection.updateOne.mockResolvedValue(mockResult);

            await expect(userRepository.updateUser(user)).rejects.toThrow(`Пользователь с ID ${user.id} не найден`);
        });

        it('должен выбросить ошибку при неудачном обновлении', async () => {
            const user: User = {
                id: '123',
                name: 'Updated User'
            };

            const mockResult = {
                acknowledged: false
            };

            mockCollection.updateOne.mockResolvedValue(mockResult);

            await expect(userRepository.updateUser(user)).rejects.toThrow(`Пользователь с ID ${user.id} не найден`);
        });
    });
}); 