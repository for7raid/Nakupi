import { ObjectId } from 'mongodb';
import { User } from '../../domain/models/User';
import { BaseRepository } from './BaseRepository';
import logger from '../logging/Logger';
import metricsService from '../monitoring/FileMetricsService';
import { IUserRepository } from '../../domain/intefaces/IUserRepository';

export class UserRepository extends BaseRepository<User> implements IUserRepository {
    constructor() {
        super('users');
    }

    async create(user: User): Promise<User> {
        try {
            const result = await this.collection.insertOne(user);
            logger.info('Пользователь создан', { userId: result.insertedId });
            return user;
        } catch (error) {
            logger.error('Ошибка при создании пользователя:', error);
            metricsService.incrementError();
            throw error;
        }
    }

    async findById(id: string): Promise<User | null> {
        try {
            return await this.collection.findOne({ _id: new ObjectId(id) });
        } catch (error) {
            logger.error('Ошибка при поиске пользователя:', error);
            metricsService.incrementError();
            throw error;
        }
    }

    async update(id: string, user: Partial<User>): Promise<User | null> {
        try {
            const result = await this.collection.findOneAndUpdate(
                { _id: new ObjectId(id) },
                { $set: user },
                { returnDocument: 'after' }
            );
            return result;
        } catch (error) {
            logger.error('Ошибка при обновлении пользователя:', error);
            metricsService.incrementError();
            throw error;
        }
    }

    async delete(id: string): Promise<boolean> {
        try {
            const result = await this.collection.deleteOne({ _id: new ObjectId(id) });
            return result.deletedCount > 0;
        } catch (error) {
            logger.error('Ошибка при удалении пользователя:', error);
            metricsService.incrementError();
            throw error;
        }
    }

    async addUser(user: User): Promise<User> {
        try {
            const result = await this.collection.insertOne(user);
            
            if (!result.acknowledged) {
                throw new Error('Не удалось создать пользователя');
            }
            
            return {
                ...user,
                id: result.insertedId.toString()
            };
        } catch (error) {
            logger.error('Ошибка при добавлении пользователя:', error);
            throw error;
        }
    }

    async getUserById(id: string): Promise<User | null> {
        try {
            const query = id.length === 24 ? { _id: new ObjectId(id) } : { id };
            return await this.collection.findOne(query);
        } catch (error) {
            logger.error('Ошибка при получении пользователя:', error);
            throw error;
        }
    }

    async updateUser(user: User): Promise<User> {
        try {
            const query = user.id.length === 24 ? { _id: new ObjectId(user.id) } : { id: user.id };
            
            const result = await this.collection.updateOne(
                query,
                { $set: { name: user.name } }
            );
            
            if (!result.acknowledged || result.modifiedCount === 0) {
                throw new Error(`Пользователь с ID ${user.id} не найден`);
            }
            
            return user;
        } catch (error) {
            logger.error('Ошибка при обновлении пользователя:', error);
            throw error;
        }
    }
}