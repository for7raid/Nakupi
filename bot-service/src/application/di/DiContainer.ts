import { ShoppingListApplicationService } from '../services/ShoppingListApplicationService';
import { UserApplicationService } from '../services/UserApplicationService';
import { ShoppingListService } from '@domain/services/ShoppingListService';
import { MongoCategoryRepository } from '@infrastructure/repositories/MongoCategoryRepository';
import { MongoItemRepository } from '@infrastructure/repositories/MongoItemRepository';
import { MongoUserRepository } from '@infrastructure/repositories/MongoUserRepository';
import { MongoUserAccessRepository } from '@infrastructure/repositories/MongoUserAccessRepository';
import { ICategoryRepository } from '@domain/repositories/ICategoryRepository';
import { IItemRepository } from '@domain/repositories/IItemRepository';
import { IUserRepository } from '@domain/repositories/IUserRepository';
import { IUserAccessRepository } from '@domain/repositories/IUserAccessRepository';
import { MongoConnection } from '@infrastructure/database/MongoConnection';
import logger from '@infrastructure/logging/Logger';

/**
 * Контейнер зависимостей для приложения.
 */
export class DiContainer {
    private static instance: DiContainer;
    private dependencies: Map<string, any>;

    private constructor() {
        this.dependencies = new Map<string, any>();
    }

    public static getInstance(): DiContainer {
        if (!DiContainer.instance) {
            DiContainer.instance = new DiContainer();
        }
        return DiContainer.instance;
    }

    /**
     * Регистрирует зависимость в контейнере.
     */
    public register<T>(name: string, instance: T): void {
        this.dependencies.set(name, instance);
    }

    /**
     * Получает зависимость из контейнера.
     */
    public get<T>(name: string): T {
        const instance = this.dependencies.get(name);
        if (!instance) {
            throw new Error(`Зависимость ${name} не зарегистрирована`);
        }
        return instance;
    }

    /**
     * Инициализирует контейнер с зависимостями.
     */
    public async initialize(): Promise<void> {
        try {
            logger.info('Инициализация DI контейнера...');
            
            // Инициализация MongoDB
            const mongoConnection = MongoConnection.getInstance();
            await mongoConnection.connect();
            
            // Регистрируем репозитории
            const categoryRepository = new MongoCategoryRepository();
            const itemRepository = new MongoItemRepository();
            const userRepository = new MongoUserRepository();
            const userAccessRepository = new MongoUserAccessRepository();
            
            this.register<ICategoryRepository>('categoryRepository', categoryRepository);
            this.register<IItemRepository>('itemRepository', itemRepository);
            this.register<IUserRepository>('userRepository', userRepository);
            this.register<IUserAccessRepository>('userAccessRepository', userAccessRepository);
            
            // Создаем и регистрируем доменные сервисы
            const shoppingListService = new ShoppingListService(
                categoryRepository, 
                itemRepository,
                userAccessRepository
            );
            
            this.register<ShoppingListService>('shoppingListService', shoppingListService);
            
            // Создаем и регистрируем сервисы приложения
            const shoppingListApplicationService = new ShoppingListApplicationService(shoppingListService);
            const userApplicationService = new UserApplicationService(userRepository);
            
            this.register<ShoppingListApplicationService>('shoppingListApplicationService', shoppingListApplicationService);
            this.register<UserApplicationService>('userApplicationService', userApplicationService);
            
            logger.info('DI контейнер успешно инициализирован');
        } catch (error) {
            logger.error('Ошибка при инициализации DI контейнера:', error);
            throw error;
        }
    }
    
    /**
     * Освобождает ресурсы контейнера.
     */
    public async dispose(): Promise<void> {
        try {
            logger.info('Освобождение ресурсов DI контейнера...');
            
            // Закрываем соединение с MongoDB
            const mongoConnection = MongoConnection.getInstance();
            await mongoConnection.disconnect();
            
            // Очищаем зависимости
            this.dependencies.clear();
            
            logger.info('Ресурсы DI контейнера освобождены');
        } catch (error) {
            logger.error('Ошибка при освобождении ресурсов DI контейнера:', error);
            throw error;
        }
    }
} 