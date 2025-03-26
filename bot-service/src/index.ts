// Регистрация алиасов должна быть первым импортом
import './alias';

import { TelegramBot } from '@presentation/tg/TelegramBot';
import { config } from '@config/config';
import logger from '@infrastructure/logging/Logger';
import { MongoConnection } from '@infrastructure/database/MongoConnection';
import metricsService, { initializeMongoMetrics, updateMetricsService } from '@infrastructure/monitoring';
import { ApiServer } from '@presentation/api/server';
import { DiContainer } from '@application/di/DiContainer';
import 'dotenv/config';

// Настройка обработчиков ошибок
function setupErrorHandlers(): void {
    // Обработка необработанных исключений
    process.on('uncaughtException', (error) => {
        logger.error('Необработанное исключение:', error);
        metricsService.incrementError();
        process.exit(1);
    });

    // Обработка необработанных отклонений промисов
    process.on('unhandledRejection', (reason, promise) => {
        logger.error('Необработанное отклонение промиса:', { reason, promise });
        metricsService.incrementError();
        process.exit(1);
    });
}

// Настройка обработчиков для корректного завершения работы
function setupGracefulShutdown(bot: TelegramBot, apiServer: ApiServer, diContainer: DiContainer): void {
    const gracefulShutdown = async (signal: string) => {
        logger.info(`Получен сигнал ${signal}, начинаем завершение работы...`);

        try {
            // Устанавливаем таймаут на случай, если процесс завершения зависнет
            const shutdownTimeout = setTimeout(() => {
                logger.warn('Превышено время ожидания завершения работы, принудительное завершение...');
                process.exit(1);
            }, 3000);

            // Останавливаем компоненты в правильном порядке
            logger.info('Останавливаем Telegram бота...');
            await bot.stop(signal);
            
            logger.info('Останавливаем API сервер...');
            await apiServer.stop();
            
            logger.info('Освобождаем ресурсы контейнера зависимостей...');
            await diContainer.dispose();
            
            // Отменяем таймаут, т.к. всё завершилось успешно
            clearTimeout(shutdownTimeout);
            
            logger.info('Все компоненты успешно остановлены'); 
            
            // Небольшая задержка перед завершением процесса
            process.exit(0);
        } catch (error) {
            logger.error('Ошибка при завершении работы:', error);
            process.exit(1);
        }
    };

    // Важно использовать функции once, а не on
    process.once('SIGINT', () => gracefulShutdown('SIGINT'));
    process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
    
    // Добавляем обработчик для сообщений от nodemon
    process.once('message', (msg) => {
        if (msg === 'shutdown') {
            gracefulShutdown('nodemon-shutdown');
        }
    });
}

// Инициализация контейнера зависимостей
async function setupDiContainer(): Promise<DiContainer> {
    logger.info('Инициализация контейнера зависимостей...');

    // Настройка переменных окружения для MongoDB
    if (config.MONGODB_URI) {
        process.env.MONGODB_URI = config.MONGODB_URI;
    }
    if (config.MONGODB_DB_NAME) {
        process.env.MONGODB_DBNAME = config.MONGODB_DB_NAME;
    }

    const diContainer = DiContainer.getInstance();
    await diContainer.initialize();
    
    logger.info('Контейнер зависимостей успешно инициализирован');
    return diContainer;
}

// Инициализация сервиса метрик
async function setupMetricsService(): Promise<void> {
    if (config.METRICS_STORAGE === 'mongo') {
        try {
            logger.info('Инициализация MongoDB метрик...');
            
            const mongoMetricsService = await initializeMongoMetrics();
            updateMetricsService(mongoMetricsService);

            logger.info('MongoDB метрики успешно инициализированы');
        } catch (error) {
            logger.warn('Не удалось инициализировать MongoDB метрики, используем файловое хранилище', { error });
            // Продолжаем использовать файловый сервис метрик по умолчанию
        }
    } else {
        logger.info('Используем файловое хранилище для метрик');
    }
}

// Инициализация API сервера
function setupApiServer(): ApiServer {
    const apiServer = new ApiServer(config.API_SERVER_PORT);
    apiServer.start();
    logger.info('API сервер успешно запущен');
    return apiServer;
}

// Инициализация Telegram бота
async function setupTelegramBot(): Promise<TelegramBot> {
    const bot = new TelegramBot(config.TELEGRAM_BOT_TOKEN);
    await bot.start();
    logger.info('Telegram бот успешно запущен');
    return bot;
}

// Основная функция запуска приложения
async function startApp(): Promise<void> {
    try {
        logger.info('Запуск приложения', {
            env: process.env.NODE_ENV || 'development'
        });

        setupErrorHandlers();
        
        const diContainer = await setupDiContainer();
        await setupMetricsService();
        
        const apiServer = setupApiServer();
        const bot = await setupTelegramBot();
        
        setupGracefulShutdown(bot, apiServer, diContainer);
        
        logger.info('Приложение успешно запущено');
        
    } catch (error) {
        logger.error('Ошибка при запуске приложения:', {
            error,
            stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
    }
}

// Запуск приложения
startApp().catch((error) => {
    logger.error('Критическая ошибка при запуске приложения:', {
        error,
        stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
});

