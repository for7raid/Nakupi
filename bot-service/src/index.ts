import { TelegramBot } from './presentation/tg/TelegramBot';
import { config } from './config/config';
import logger from './infrastructure/logging/Logger';
import { MongoConnection } from './infrastructure/database/MongoConnection';
import metricsService, { initializeMongoMetrics, updateMetricsService } from './infrastructure/monitoring';

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

async function startApp() {
    try {
        logger.info('Запуск приложения', {
            env: process.env.NODE_ENV || 'development',
            service: 'bot-service',
            timestamp: new Date().toISOString()
        });

        // Инициализация соединения с MongoDB
        logger.info('Инициализация соединения с MongoDB...', {
            service: 'bot-service',
            timestamp: new Date().toISOString()
        });
        await MongoConnection.getInstance(
            config.MONGODB_URI,
            config.MONGODB_DB_NAME
        ).connect();

        // Инициализация MongoDB метрик, если выбран соответствующий тип хранилища
        if (config.METRICS_STORAGE === 'mongo') {
            try {
                // Пытаемся инициализировать MongoDB метрики
                const mongoMetricsService = await initializeMongoMetrics();
                // Обновляем глобальный сервис метрик
                updateMetricsService(mongoMetricsService);
            } catch (error) {
                logger.warn('Не удалось инициализировать MongoDB метрики, используем файловое хранилище', { error });
                // Продолжаем использовать файловый сервис метрик по умолчанию
            }
        } else {
            logger.info('Используем файловое хранилище для метрик');
        }

        // Инициализация бота
        logger.info('Инициализация бота...', {
            service: 'bot-service',
            timestamp: new Date().toISOString()
        });
        const bot = new TelegramBot(config.TELEGRAM_BOT_TOKEN);
        await bot.start();

        logger.info('Приложение успешно запущено', {
            service: 'bot-service',
            timestamp: new Date().toISOString()
        });

        // Обработка завершения работы
        process.once('SIGINT', () => bot.stop('SIGINT'));
        process.once('SIGTERM', () => bot.stop('SIGTERM'));
    } catch (error) {
        logger.error('Ошибка при запуске приложения:', error);
        metricsService.incrementError();
        process.exit(1);
    }
}

startApp();

