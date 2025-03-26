import { Telegraf, session, Scenes } from 'telegraf';
import LocalSession from 'telegraf-session-local';
import { BotContext, BotSession } from './types/session';
import logger from '@infrastructure/logging/Logger';
import metricsService from '@infrastructure/monitoring/FileMetricsService';
import { MainMenuScene, MAIN_MENU_SCENE_ID } from './scenes/MainMenuScene';
import { 
    ManageCategoriesScene, 
    MANAGE_CATEGORIES_SCENE_ID,
    ADD_CATEGORY_SCENE_ID
} from './scenes/ManageCategoriesScene';
import { 
    CategoryScene, 
    CATEGORY_SCENE_ID, 
    SHOW_PURCHASED_SCENE_ID 
} from './scenes/CategoryScene';
import { DiContainer } from '@application/di/DiContainer';
import { ShoppingListApplicationService } from '@application/services/ShoppingListApplicationService';
import { UserApplicationService } from '@application/services/UserApplicationService';
import { CategoryDto } from '@application/dto/CategoryDto';
import { ShoppingListItemDto } from '@application/dto/ShoppingListItemDto';
import { ShoppingServiceAdapter } from './adapters/ShoppingServiceAdapter';
import { IShoppingServiceAdapter } from './adapters/IShoppingServiceAdapter';

export class TelegramBot {
    private bot: Telegraf<BotContext>;
    private stage!: Scenes.Stage<BotContext>;
    private shoppingListService: ShoppingListApplicationService;
    private userService: UserApplicationService;
    private diContainer: DiContainer;

    constructor(token: string) {
        if (!token) {
            throw new Error('Токен бота не предоставлен');
        }

        // Получаем контейнер зависимостей
        this.diContainer = DiContainer.getInstance();
        
        // Получаем сервисы приложения
        this.shoppingListService = this.diContainer.get<ShoppingListApplicationService>('shoppingListApplicationService');
        this.userService = this.diContainer.get<UserApplicationService>('userApplicationService');

        // Создание бота
        this.bot = new Telegraf<BotContext>(token);

        // Инициализация локальной сессии
        const localSession = new LocalSession({
            database: 'sessions.json',
            property: 'session',
            storage: LocalSession.storageMemory,
            format: {
                serialize: (obj) => JSON.stringify(obj, null, 2),
                deserialize: (str) => JSON.parse(str)
            },
            state: {
                userId: null,
                userName: null,
                currentCategoryId: null,
                categories: [],
                items: []
            }
        });

        // Middleware для сессии
        this.bot.use(localSession.middleware());

        // Middleware для инициализации данных сессии
        this.bot.use(async (ctx, next) => {
            if (!ctx.session) {
                ctx.session = {
                    userId: '',
                    userName: '',
                    currentCategoryId: '',
                    categories: [],
                    items: []
                };
            }
            return next();
        });

        // Инициализация сцен
        this.initScenes();

        // Middleware для сцен
        this.bot.use(this.stage.middleware());

        // Обработка ошибок
        this.bot.catch((err, ctx) => {
            logger.error('Ошибка Telegraf:', err);
            metricsService.incrementError();
            ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже или используйте команду /start для перезапуска бота.');
        });

        // Команда /start - направляет в главное меню
        this.bot.start(async (ctx) => {
            try {
                if (!ctx.from) {
                    logger.warn('Контекст не содержит информации о пользователе');
                    return await ctx.reply('❌ Не удалось идентифицировать пользователя. Пожалуйста, попробуйте снова.');
                }
                
                logger.info('Получена команда /start', { userId: ctx.from.id });
                metricsService.incrementStartCommand();
                
                const userId = ctx.from.id.toString();
                
                // Проверяем, существует ли пользователь в базе данных
                const existingUser = await this.userService.getUserById(userId);
                const isNewUser = !existingUser;
                
                // Сохраняем информацию о пользователе
                await this.saveUserInfo(ctx);
                
                // Показываем приветственное сообщение
                if (isNewUser) {
                    // Для нового пользователя - полное приветствие
                    await ctx.reply(
                        `👋 Здравствуйте, ${ctx.from.first_name || 'дорогой пользователь'}!\n\n` +
                        `🛒 Добро пожаловать в Nakupi - бот для ведения списка покупок.\n\n` +
                        `С помощью этого бота вы можете:\n` +
                        `✅ Создавать категории товаров\n` +
                        `✅ Добавлять товары в список покупок\n` +
                        `✅ Отмечать купленные товары\n` +
                        `✅ Делиться списками с другими пользователями\n\n` +
                        `Используйте меню ниже, чтобы начать работу!`
                    );
                } else {
                    // Для существующего пользователя - простое приветствие
                    await ctx.reply(`👋 С возвращением, ${ctx.from.first_name || 'дорогой пользователь'}!`);
                }
                
                // Переходим в главное меню
                await ctx.scene.enter(MAIN_MENU_SCENE_ID);
            } catch (error) {
                logger.error('Ошибка при обработке команды /start:', error);
                metricsService.incrementError();
                await ctx.reply('❌ Произошла ошибка при запуске бота. Пожалуйста, попробуйте снова позже.');
            }
        });

        // Команда /help
        this.bot.help(async (ctx) => {
            try {
                if (ctx.from) {
                    logger.info('Получена команда /help', { userId: ctx.from.id });
                }
                metricsService.incrementError();
                await ctx.reply(
                    '🛒 Nakupi - Бот для списка покупок\n\n' +
                    'Команды:\n' +
                    '/start - Открыть главное меню\n' +
                    '/help - Показать справку\n\n' +
                    'В главном меню можно создавать и выбирать категории покупок.\n' +
                    'Внутри категории можно добавлять элементы, а также отмечать их как купленные.'
                );
            } catch (error) {
                logger.error('Ошибка при обработке команды /help:', error);
                metricsService.incrementError();
                await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
            }
        });

        logger.info('Бот успешно инициализирован');
    }

    private initScenes(): void {
        try {
            const shoppingServiceAdapter: IShoppingServiceAdapter = new ShoppingServiceAdapter(
                this.shoppingListService,
                this.userService
            );

            // Создаем экземпляры обработчиков сцен
            const mainMenuScene = new MainMenuScene(shoppingServiceAdapter);
            const manageCategoriesScene = new ManageCategoriesScene(shoppingServiceAdapter);
            const categoryScene = new CategoryScene(shoppingServiceAdapter);

            // Получаем экземпляры всех сцен
            const scenes = [
                mainMenuScene.getScene(),
                mainMenuScene.getJoinListScene(),
                manageCategoriesScene.getScene(),
                manageCategoriesScene.getAddCategoryScene(),
                categoryScene.getCategoryScene(),
                categoryScene.getShowPurchasedScene(),
                categoryScene.getManageAccessScene()
            ];

            // Создаем Stage с добавлением всех сцен
            this.stage = new Scenes.Stage<BotContext>(scenes);

            logger.info('Сцены бота успешно инициализированы', {
                scenesCount: scenes.length
            });
        } catch (error) {
            logger.error('Ошибка при инициализации сцен бота:', error);
            throw new Error('Не удалось инициализировать сцены бота');
        }
    }

    private async saveUserInfo(ctx: BotContext): Promise<void> {
        try {
            if (!ctx.from) {
                logger.warn('Контекст не содержит информации о пользователе');
                return;
            }
            
            const userId = ctx.from.id.toString();
            const userName = ctx.from.username || 
                `${ctx.from.first_name || ''} ${ctx.from.last_name || ''}`.trim() || 
                `user_${userId}`;

            // Инициализируем данные сессии, если они не существуют
            if (!ctx.session) {
                ctx.session = {
                    userId: '',
                    userName: '',
                    currentCategoryId: '',
                    categories: [],
                    items: []
                };
            }

            // Сохраняем в базе данных
            await this.userService.registerUser(userId, userName);
            
            // Отмечаем активность пользователя
            await this.userService.markUserActivity(userId);

            // Сохраняем в сессии
            ctx.session.userId = userId;
            ctx.session.userName = userName;

            // Загружаем категории пользователя в сессию
            ctx.session.categories = await this.shoppingListService.getCategories(userId) as any[];
            ctx.session.items = await this.shoppingListService.getItems(userId) as any[];

            logger.debug('Информация о пользователе сохранена', {
                userId,
                userName,
                categoriesCount: ctx.session.categories.length,
                itemsCount: ctx.session.items.length
            });
        } catch (error) {
            logger.error('Ошибка при сохранении информации о пользователе:', error);
            metricsService.incrementError();
        }
    }

    public async start() {
        const maxAttempts = 3;
        let attempts = 0;
        let lastError: unknown;

        while (attempts < maxAttempts) {
            try {
                // Инициализируем контейнер зависимостей, если еще не инициализирован
                if (!this.shoppingListService || !this.userService) {
                    await this.diContainer.initialize();
                    this.shoppingListService = this.diContainer.get<ShoppingListApplicationService>('shoppingListApplicationService');
                    this.userService = this.diContainer.get<UserApplicationService>('userApplicationService');
                }

                // Если это повторная попытка, делаем небольшую паузу 
                if (attempts > 0) {
                    logger.info(`Повторная попытка запуска бота (${attempts}/${maxAttempts})...`);
                    // Ждем 2 секунды перед повторной попыткой
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }

                // Запускаем бота
                await this.bot.launch();
                logger.info('Бот запущен и готов к работе', {
                    service: 'bot-service',
                    timestamp: new Date().toISOString()
                });
                metricsService.incrementStartCommand();
                return; // Успешно запустились, выходим из цикла
            } catch (error: unknown) {
                lastError = error;
                attempts++;
                
                // Если ошибка связана с конфликтом экземпляров
                if (error && typeof error === 'object' && 'description' in error && 
                    typeof error.description === 'string' && 
                    error.description.includes('terminated by other getUpdates request')) {
                    
                    if (attempts < maxAttempts) {
                        logger.warn(`Обнаружен конфликт: другой экземпляр бота уже запущен. Попытка ${attempts}/${maxAttempts}`);
                        // Продолжаем и попробуем еще раз после паузы
                        continue;
                    } else {
                        logger.error(`Не удалось запустить бота после ${maxAttempts} попыток из-за конфликта экземпляров`);
                        // Выходим в случае превышения лимита попыток
                        process.exit(1);
                    }
                } else {
                    // Другие ошибки просто логируем и выбрасываем
                    logger.error('Ошибка при запуске бота:', error);
                    metricsService.incrementError();
                    throw error;
                }
            }
        }

        // Если мы добрались сюда, значит все попытки были исчерпаны
        logger.error(`Не удалось запустить бота после ${maxAttempts} попыток`);
        metricsService.incrementError();
        throw lastError;
    }

    public async stop(signal: string) {
        try {
            logger.info(`Останавливаем бота (сигнал: ${signal})...`);
            
            // Останавливаем бота и ждем завершения
            await this.bot.stop(signal);
            
            // Дополнительная пауза для гарантированного освобождения ресурсов
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            logger.info('Бот успешно остановлен');
        } catch (error) {
            logger.error('Ошибка при остановке бота:', error);
            metricsService.incrementError();
        }
    }
} 