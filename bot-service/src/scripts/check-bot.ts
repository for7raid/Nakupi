import { Telegraf } from 'telegraf';
import { config } from '../config/config';
import logger from '../infrastructure/logging/Logger';
import { MongoConnection } from '../infrastructure/database/MongoConnection';
import metricsService from '../infrastructure/monitoring/FileMetricsService';

/**
 * Скрипт для проверки работоспособности бота и соединения с MongoDB
 * Запуск: npx ts-node src/scripts/checkBot.ts
 */

async function checkBot(): Promise<void> {
    logger.info('Начинаем проверку бота...');

    try {
        // Проверяем подключение к MongoDB
        const mongoConn = MongoConnection.getInstance(config.MONGODB_URI, config.MONGODB_DB_NAME);
        await mongoConn.connect();
        logger.info('Подключение к MongoDB успешно установлено');
        metricsService.incrementDbConnection();

        // Проверяем токен бота
        if (!config.TELEGRAM_BOT_TOKEN) {
            throw new Error('Токен бота не найден в конфигурации');
        }

        logger.info('Проверка бота успешно завершена');
        process.exit(0);
    } catch (error) {
        logger.error('Ошибка при проверке бота:', error);
        metricsService.incrementError();
        process.exit(1);
    }
}

// Запускаем проверку
checkBot(); 