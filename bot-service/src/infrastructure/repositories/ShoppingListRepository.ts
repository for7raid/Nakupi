import { IShoppingListRepository } from '../../domain/intefaces/IShoppingListRepository';
import { ShoppingListItem } from '../../domain/models/ShoppingListItem';
import { Category } from '../../domain/models/Category';
import { MongoConnection } from '../database/MongoConnection';
import { Document, WithId, ObjectId, Db } from 'mongodb'; 
import logger from '../logging/Logger';
import { config } from '../../config/config';
import metricsService from '../monitoring/FileMetricsService';

// Класс для представления списка покупок
export class ShoppingList {
    id: string;
    userId: string;
    name: string;
    items: ShoppingListItem[];
    
    constructor(data: any) {
        this.id = data.id || '';
        this.userId = data.userId || '';
        this.name = data.name || '';
        this.items = data.items || [];
    }
}

// TODO: избавиться
export class ShoppingListRepository implements IShoppingListRepository {
    protected db: Db | null = null;
    protected mongoConn: MongoConnection;
    protected isInitialized: boolean = false;
    protected initPromise: Promise<void> | null = null;

    constructor() {
        try {
            logger.debug('Инициализация ShoppingListRepository');
            this.mongoConn = MongoConnection.getInstance(config.MONGODB_URI, config.MONGODB_DB_NAME);
            // Откладываем инициализацию до первого вызова методов
            logger.debug('ShoppingListRepository создан, но соединение будет установлено при первом запросе');
        } catch (error) {
            logger.error('Ошибка при инициализации ShoppingListRepository:', error);
            throw error;
        }
    } 
    
    private async ensureInitialized(): Promise<void> {
        if (this.isInitialized && this.db) {
            return Promise.resolve();
        }
        
        if (this.initPromise) {
            return this.initPromise;
        }
        
        this.initPromise = new Promise<void>(async (resolve, reject) => {
            try {
                logger.debug('Инициализация соединения с базой данных в ShoppingListRepository');
                await this.connect();
                
                if (!this.mongoConn.isConnectedToDb()) {
                    throw new Error('Не удалось установить соединение с базой данных');
                }
                
                const client = this.mongoConn.getClient();
                if (!client) {
                    throw new Error('MongoDB клиент не инициализирован');
                }
                
                this.db = client.db(this.mongoConn.getDbName());
                if (!this.db) {
                    throw new Error('Не удалось получить объект базы данных');
                }
                
                logger.info('Соединение с базой данных установлено в ShoppingListRepository');
                this.isInitialized = true;
                resolve();
            } catch (error) {
                logger.error('Ошибка при инициализации ShoppingListRepository:', error);
                reject(error);
            } finally {
                this.initPromise = null;
            }
        });
        
        return this.initPromise;
    }
    
    public async addItem(item: ShoppingListItem): Promise<void> {
        try {
            await this.ensureInitialized();
            if (!this.db) {
                throw new Error('База данных не инициализирована');
            }
            
            logger.debug('Добавление нового элемента списка покупок', { itemName: item.name });
            await this.db.collection('items').insertOne(item);
            logger.debug('Добавлен новый элемент списка покупок', { itemName: item.name });
        } catch (error) {
            logger.error('Ошибка при добавлении элемента списка покупок:', error);
            throw error;
        }
    }

    public async removeItem(id: string): Promise<void> { 
        try {
            await this.ensureInitialized();
            if (!this.db) {
                throw new Error('База данных не инициализирована');
            }
            
            logger.debug('Удаление элемента списка покупок', { itemId: id });
            await this.db.collection('items').deleteOne({ _id: new ObjectId(id) });
            logger.debug('Удален элемент списка покупок', { itemId: id });
        } catch (error) {
            logger.error('Ошибка при удалении элемента списка покупок:', error);
            throw error;
        }
    }

    public async getItems(userId: string, categoryId?: string): Promise<ShoppingListItem[]> {
        try {
            await this.ensureInitialized();
            if (!this.db) {
                throw new Error('База данных не инициализирована');
            }
            
            const query: any = { userId };
        
            if (categoryId) {
                query['categoryId'] = categoryId;
            } 
            
            logger.debug('Получение элементов списка покупок', { query });
        
            const items = await this.db.collection('items').find(query).toArray();
            logger.debug('Получены элементы списка покупок', { count: items.length });
        
            return items.map((item: WithId<Document>) => ({
                id: item._id.toString(),
                name: item.name,
                quantity: item.quantity,
                purchased: item.purchased,
                categoryId: item.categoryId,
                userId: item.userId,
            })) as ShoppingListItem[];
        } catch (error) {
            logger.error('Ошибка при получении элементов списка покупок:', error);
            throw error;
        }
    }

    public async addCategory(category: Category): Promise<void> {
        try {
            await this.ensureInitialized();
            if (!this.db) {
                throw new Error('База данных не инициализирована');
            }
            
            logger.debug('Добавление новой категории', { categoryName: category.name });
            await this.db.collection('categories').insertOne(category);
            logger.debug('Добавлена новая категория', { categoryName: category.name });
        } catch (error) {
            logger.error('Ошибка при добавлении категории:', error);
            throw error;
        }
    }

    public async getCategories(userId: string): Promise<Category[]> {
        try {
            await this.ensureInitialized();
            if (!this.db) {
                throw new Error('База данных не инициализирована');
            }
            
            logger.debug('Получение категорий пользователя', { userId });
            const categories = await this.db.collection('categories').find({ userId }).toArray();
            logger.debug('Получены категории пользователя', { count: categories.length });
            
            return categories.map((cat: WithId<Document>) => ({
                id: cat._id.toString(),
                name: cat.name,
                userId: cat.userId,
            })) as Category[];
        } catch (error) {
            logger.error('Ошибка при получении категорий:', error);
            throw error;
        }
    }

    public async removeCategory(id: string): Promise<void> {
        try {
            await this.ensureInitialized();
            if (!this.db) {
                throw new Error('База данных не инициализирована');
            }
            
            logger.debug('Удаление категории и связанных элементов', { categoryId: id });
            // Сначала удаляем все элементы в категории
            await this.db.collection('items').deleteMany({ categoryId: id });
            // Затем удаляем саму категорию
            await this.db.collection('categories').deleteOne({ _id: new ObjectId(id) });
            logger.debug('Удалена категория и связанные элементы', { categoryId: id });
        } catch (error) {
            logger.error('Ошибка при удалении категории:', error);
            throw error;
        }
    }

    public async markAsPurchased(id: string): Promise<void> {
        try {
            await this.ensureInitialized();
            if (!this.db) {
                throw new Error('База данных не инициализирована');
            }
            
            logger.debug('Отметка элемента как купленного', { itemId: id });
            await this.db.collection('items').updateOne(
                { _id: new ObjectId(id) }, 
                { $set: { purchased: true } }
            );
            logger.debug('Элемент отмечен как купленный', { itemId: id });
        } catch (error) {
            logger.error('Ошибка при отметке элемента как купленного:', error);
            throw error;
        }
    }

    public async markAsNotPurchased(id: string): Promise<void> {
        try {
            await this.ensureInitialized();
            if (!this.db) {
                throw new Error('База данных не инициализирована');
            }
            
            logger.debug('Отметка элемента как не купленного', { itemId: id });
            await this.db.collection('items').updateOne(
                { _id: new ObjectId(id) }, 
                { $set: { purchased: false } }
            );
            logger.debug('Элемент отмечен как не купленный', { itemId: id });
        } catch (error) {
            logger.error('Ошибка при отметке элемента как не купленного:', error);
            throw error;
        }
    }

    async connect(): Promise<void> {
        try {
            if (!this.mongoConn) {
                this.mongoConn = MongoConnection.getInstance(config.MONGODB_URI, config.MONGODB_DB_NAME);
            }

            const client = this.mongoConn.getClient();
            if (!client) {
                throw new Error('MongoDB клиент не инициализирован');
            }

            this.db = client.db(config.MONGODB_DB_NAME);
            logger.info('Подключение к MongoDB установлено');
            metricsService.incrementDbConnection();
        } catch (error) {
            logger.error('Ошибка при подключении к MongoDB:', error);
            metricsService.incrementError();
            throw error;
        }
    }

    async saveList(list: ShoppingList): Promise<void> {
        try {
            await this.ensureInitialized();
            if (!this.db) {
                throw new Error('База данных не инициализирована');
            }
            
            await this.db.collection('shopping_lists').updateOne(
                { id: list.id },
                { $set: list },
                { upsert: true }
            );
            logger.debug('Список покупок сохранен', { listId: list.id });
        } catch (error) {
            logger.error('Ошибка при сохранении списка покупок:', error);
            throw error;
        }
    }

    async getList(id: string): Promise<ShoppingList | null> {
        try {
            await this.ensureInitialized();
            if (!this.db) {
                throw new Error('База данных не инициализирована');
            }
            
            const list = await this.db.collection('shopping_lists').findOne({ id });
            return list ? new ShoppingList(list) : null;
        } catch (error) {
            logger.error('Ошибка при получении списка покупок:', error);
            throw error;
        }
    }
}