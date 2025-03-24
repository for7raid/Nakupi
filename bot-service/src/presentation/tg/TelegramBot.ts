import { Telegraf, session, Scenes } from 'telegraf';
import LocalSession from 'telegraf-session-local';
import { ShoppingService } from '../../application/services/ShoppingService';
import { CategoryRepository } from '../../infrastructure/repositories/CategoryRepository';
import { ItemRepository } from '../../infrastructure/repositories/ItemRepository';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { BotContext, SceneSessionData } from './types/session';
import logger from '../../infrastructure/logging/Logger';
import metricsService from '../../infrastructure/monitoring/FileMetricsService';
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

export class TelegramBot {
    private bot: Telegraf<BotContext>;
    private stage!: Scenes.Stage<BotContext>;
    private shoppingService: ShoppingService;

    constructor(token: string) {
        if (!token) {
            throw new Error('Токен бота не предоставлен');
        }

        // Инициализация репозиториев
        const categoryRepository = new CategoryRepository();
        const itemRepository = new ItemRepository();
        const userRepository = new UserRepository();

        // Инициализация сервиса
        this.shoppingService = new ShoppingService(
            categoryRepository,
            itemRepository,
            userRepository
        );

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
                    currentCategoryId: null,
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
                
                // Сохраняем информацию о пользователе
                await this.saveUserInfo(ctx);
                
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
            // Создаем экземпляры обработчиков сцен
            const mainMenuScene = new MainMenuScene(this.shoppingService);
            const manageCategoriesScene = new ManageCategoriesScene(this.shoppingService);
            const categoryScene = new CategoryScene(this.shoppingService);

            // Получаем экземпляры всех сцен
            const mainMenuSceneInstance = mainMenuScene.getScene();
            const manageCategoriesSceneInstance = manageCategoriesScene.getScene();
            const addCategorySceneInstance = manageCategoriesScene.getAddCategoryScene();
            const categorySceneInstance = categoryScene.getCategoryScene();
            const showPurchasedSceneInstance = categoryScene.getShowPurchasedScene();

            // Создаем Stage с добавлением всех сцен
            this.stage = new Scenes.Stage<BotContext>([
                mainMenuSceneInstance,
                manageCategoriesSceneInstance,
                addCategorySceneInstance,
                categorySceneInstance,
                showPurchasedSceneInstance
            ]);

            logger.info('Сцены бота успешно инициализированы', {
                scenesCount: 5
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
                    currentCategoryId: null,
                    categories: [],
                    items: []
                };
            }

            // Сохраняем в базе данных
            await this.shoppingService.saveUser({
                id: userId,
                name: userName
            });

            // Сохраняем в сессии
            ctx.session.userId = userId;
            ctx.session.userName = userName;

            // Загружаем категории пользователя в сессию
            ctx.session.categories = await this.shoppingService.getCategories(userId);
            ctx.session.items = await this.shoppingService.getItems(userId);

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
        try {
            // Обработка graceful shutdown
            const stopBot = () => {
                logger.info('Получен сигнал завершения работы, останавливаем бота...');
                this.stop('SIGINT');
                process.exit(0);
            };

            // Регистрируем обработчики сигналов
            process.once('SIGINT', stopBot);
            process.once('SIGTERM', stopBot);

            // Запускаем бота
            await this.bot.launch();
            logger.info('Бот запущен и готов к работе', {
                service: 'bot-service',
                timestamp: new Date().toISOString()
            });
            metricsService.incrementStartCommand();
        } catch (error: unknown) {
            logger.error('Ошибка при запуске бота:', error);
            metricsService.incrementError();
            
            // Если ошибка связана с конфликтом экземпляров
            if (error && typeof error === 'object' && 'description' in error && 
                typeof error.description === 'string' && 
                error.description.includes('terminated by other getUpdates request')) {
                logger.error('Обнаружен конфликт: другой экземпляр бота уже запущен');
                process.exit(1);
            }
            
            throw error;
        }
    }

    public async stop(signal: string) {
        try {
            await this.bot.stop(signal);
            logger.info('Бот остановлен', {
                signal,
                service: 'bot-service',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error('Ошибка при остановке бота:', error);
            throw error;
        }
    }
} 