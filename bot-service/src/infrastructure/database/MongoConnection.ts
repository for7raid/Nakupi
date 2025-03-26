import { MongoClient, Db, Collection, Document } from 'mongodb';
import logger from '@infrastructure/logging/Logger';
import metricsService from '@infrastructure/monitoring';

/**
 * Класс для управления подключением к MongoDB
 * Реализует паттерн Singleton
 */
export class MongoConnection {
    private static instance: MongoConnection;
    private client: MongoClient | null = null;
    private db: Db | null = null;
    private readonly collections = new Map<string, Collection<Document>>();
    
    private constructor() {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
        const dbName = process.env.MONGODB_DBNAME || 'nakupi';
        this.uri = uri;
        this.dbName = dbName;
    }

    private readonly uri: string;
    private readonly dbName: string;

    /**
     * Получение единственного экземпляра класса
     */
    public static getInstance(): MongoConnection {
        if (!MongoConnection.instance) {
            MongoConnection.instance = new MongoConnection();
        }
        return MongoConnection.instance;
    }

    /**
     * Установка соединения с MongoDB
     * @throws Error если соединение не может быть установлено
     */
    public async connect(): Promise<void> {
        try {
            if (this.isConnected()) {
                logger.debug('MongoDB соединение уже установлено');
                return;
            }

            this.client = new MongoClient(this.uri);
            await this.client.connect();
            this.db = this.client.db(this.dbName);
            
            logger.info('MongoDB успешно подключена');
            metricsService.incrementDbConnection();
        } catch (error) {
            logger.error('Ошибка подключения к MongoDB:', error);
            metricsService.incrementError();
            this.client = null;
            this.db = null;
            throw error;
        }
    }

    /**
     * Проверка активного соединения
     */
    public isConnected(): boolean {
        return this.client !== null && this.db !== null;
    }

    /**
     * Получение коллекции MongoDB
     * @param name Имя коллекции
     * @throws Error если соединение не установлено
     */
    public async getCollection<T extends Document = Document>(name: string): Promise<Collection<T>> {
        if (!this.isConnected()) {
            await this.connect();
        }
        
        if (!this.collections.has(name)) {
            if (!this.db) {
                throw new Error('База данных не инициализирована');
            }
            this.collections.set(name, this.db.collection<Document>(name));
        }
        
        // Безопасное приведение типа
        return this.collections.get(name) as unknown as Collection<T>;
    }

    /**
     * Закрытие соединения с MongoDB
     */
    public async disconnect(): Promise<void> {
        try {
            if (this.client) {
                logger.info('Закрываем соединение с MongoDB...');
                
                // Устанавливаем таймаут для принудительного закрытия
                const timeoutId = setTimeout(() => {
                    logger.warn('Превышено время ожидания закрытия MongoDB, принудительное завершение...');
                    this.client = null;
                    this.db = null;
                    this.collections.clear();
                }, 1000);
                
                // Пытаемся закрыть соединение корректно
                await this.client.close(true); // форсированное закрытие
                
                // Если успешно закрыли, отменяем таймаут
                clearTimeout(timeoutId);
                
                this.client = null;
                this.db = null;
                this.collections.clear();
                logger.info('MongoDB соединение закрыто');
            }
        } catch (error) {
            logger.error('Ошибка при закрытии соединения с MongoDB:', error);
            metricsService.incrementError();
            
            // При ошибке закрытия соединения сбрасываем ссылки
            this.client = null;
            this.db = null;
            this.collections.clear();
            
            throw error;
        }
    }

    /**
     * Получение имени базы данных
     */
    public getDbName(): string {
        return this.dbName;
    }

    public async initialize(): Promise<void> {
        try {
            // Подключаемся к MongoDB
            this.client = new MongoClient(this.uri);
            await this.client.connect();
            
            this.db = this.client.db(this.dbName);
            
            // Создаем индексы
            // await this.createIndexes();
            
            logger.info('Успешное подключение к MongoDB');
        } catch (error) {
            logger.error('Ошибка при подключении к MongoDB:', error);
            throw error;
        }
    }
    
    // private async createIndexes(): Promise<void> {
    //     // Индексы для коллекции categories
    //     await this.db.collection('categories').createIndex({ categoryId: 1 }, { unique: true });
    //     await this.db.collection('categories').createIndex({ userId: 1 });
    //     await this.db.collection('categories').createIndex({ shareCode: 1 }, { sparse: true });
        
    //     // Индексы для коллекции items
    //     await this.db.collection('items').createIndex({ itemId: 1 }, { unique: true });
    //     await this.db.collection('items').createIndex({ userId: 1 });
    //     await this.db.collection('items').createIndex({ categoryId: 1 });
        
    //     // Индексы для коллекции user_access
    //     await this.db.collection('user_access').createIndex({ userId: 1, categoryId: 1 }, { unique: true });
    //     await this.db.collection('user_access').createIndex({ categoryId: 1 });
    // }
}