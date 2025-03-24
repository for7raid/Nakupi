import { Collection, Document, Filter, FindOptions, MongoClient, ObjectId, OptionalUnlessRequiredId, UpdateFilter, WithId } from 'mongodb';
import { config } from '../../config/config';
import logger from '../logging/Logger';
import { MongoConnection } from '../database/MongoConnection';
import metricsService from '../monitoring';

/**
 * Базовый класс репозитория для MongoDB
 * Предоставляет общую функциональность для работы с коллекциями
 */
export abstract class BaseRepository<T extends Document> {
    protected client: MongoClient;
    protected collection: Collection<T>;

    constructor(collectionName: string) {
        const mongoConnection = MongoConnection.getInstance(
            process.env.MONGODB_URI || 'mongodb://localhost:27017',
            process.env.MONGODB_DB_NAME || 'nakupi'
        );
        
        const client = mongoConnection.getClient();
        if (!client) {
            throw new Error('MongoDB клиент не инициализирован');
        }
        
        this.client = client;
        const db = mongoConnection.getDatabase();
        if (!db) {
            throw new Error('База данных MongoDB не инициализирована');
        }
        
        this.collection = db.collection<T>(collectionName);
    }

    /**
     * Создает новый документ в коллекции
     */
    protected async create(item: OptionalUnlessRequiredId<T>): Promise<T> {
        try {
            const result = await this.collection.insertOne(item);
            
            if (!result.acknowledged || !result.insertedId) {
                throw new Error(`Не удалось создать документ в коллекции ${this.collection.collectionName}`);
            }
            
            logger.info(`Документ создан в коллекции ${this.collection.collectionName}`, { id: result.insertedId });
            
            return {
                ...item,
                _id: result.insertedId
            } as unknown as T;
        } catch (error) {
            this.handleError(`Ошибка при создании документа в ${this.collection.collectionName}`, error);
            throw error;
        }
    }

    /**
     * Находит документ по ID
     */
    protected async findById(id: string): Promise<T | null> {
        try {
            const result = await this.collection.findOne({ _id: new ObjectId(id) } as Filter<T>);
            return result as T | null;
        } catch (error) {
            this.handleError(`Ошибка при поиске документа по ID в ${this.collection.collectionName}`, error);
            throw error;
        }
    }

    /**
     * Находит документы по фильтру
     */
    protected async find(filter: Filter<T>, options?: FindOptions<T>): Promise<T[]> {
        try {
            const results = await this.collection.find(filter, options).toArray();
            return results as unknown as T[];
        } catch (error) {
            this.handleError(`Ошибка при поиске документов в ${this.collection.collectionName}`, error);
            throw error;
        }
    }

    /**
     * Обновляет документ по ID
     */
    protected async update(id: string, updateData: Partial<T>): Promise<T | null> {
        try {
            const result = await this.collection.findOneAndUpdate(
                { _id: new ObjectId(id) } as Filter<T>,
                { $set: updateData } as UpdateFilter<T>,
                { returnDocument: 'after' }
            );
            
            return result as unknown as T | null;
        } catch (error) {
            this.handleError(`Ошибка при обновлении документа в ${this.collection.collectionName}`, error);
            throw error;
        }
    }

    /**
     * Удаляет документ по ID
     */
    protected async delete(id: string): Promise<boolean> {
        try {
            const result = await this.collection.deleteOne({ _id: new ObjectId(id) } as Filter<T>);
            return result.deletedCount > 0;
        } catch (error) {
            this.handleError(`Ошибка при удалении документа из ${this.collection.collectionName}`, error);
            throw error;
        }
    }

    /**
     * Удаляет документы по фильтру
     */
    protected async deleteMany(filter: Filter<T>): Promise<number> {
        try {
            const result = await this.collection.deleteMany(filter);
            return result.deletedCount;
        } catch (error) {
            this.handleError(`Ошибка при удалении документов из ${this.collection.collectionName}`, error);
            throw error;
        }
    }

    /**
     * Обрабатывает ошибки репозитория
     */
    protected handleError(message: string, error: unknown): void {
        logger.error(message, error);
        metricsService.incrementError();
    }
} 