import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
import logger from '../infrastructure/logging/Logger';

// Определяем схему валидации переменных окружения
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']),
    TELEGRAM_BOT_TOKEN: z.string(),
    MONGODB_URI: z.string(),
    MONGODB_DB_NAME: z.string(),
    METRICS_FILE_PATH: z.string(),
    METRICS_STORAGE: z.enum(['file', 'mongo']).optional().default('file'),
    API_SERVER_PORT: z.number().optional().default(3001)
});

// Функция для загрузки конфигурации
function loadConfig() {
    const env = process.env.NODE_ENV || 'development';
    const envFile = `.env.${env}`;
    const envPath = path.resolve(process.cwd(), envFile);
    
    console.log(`[CONFIG] Загрузка конфигурации из файла: ${envPath}`);
    console.log(`[CONFIG] Текущее значение NODE_ENV: ${env}`);
    
    // Загружаем переменные окружения из соответствующего файла
    const result = dotenv.config({ path: envPath });
    
    if (result.error) {
        console.error(`[CONFIG] Ошибка при загрузке конфигурации из файла ${envFile}:`, result.error.message);
        logger.error(`Ошибка при загрузке конфигурации из файла ${envFile}`, {
            error: result.error.message,
            service: 'bot-service',
            timestamp: new Date().toISOString()
        });
        throw new Error(`Ошибка при загрузке конфигурации из файла ${envFile}`);
    }

    console.log(`[CONFIG] Переменные окружения после загрузки: NODE_ENV=${process.env.NODE_ENV}, METRICS_STORAGE=${process.env.METRICS_STORAGE}`);
    
    logger.info(`Загружены настройки из файла ${envPath}`, {
        service: 'bot-service',
        timestamp: new Date().toISOString()
    });

    try {
        const config = envSchema.parse({
            NODE_ENV: process.env.NODE_ENV || env,
            TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN,
            MONGODB_URI: process.env.MONGODB_URI,
            MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,
            METRICS_FILE_PATH: process.env.METRICS_FILE_PATH,
            METRICS_STORAGE: process.env.METRICS_STORAGE,
            API_SERVER_PORT: process.env.API_SERVER_PORT ? parseInt(process.env.API_SERVER_PORT, 10) : undefined
        });
        
        console.log(`[CONFIG] Итоговая конфигурация: NODE_ENV=${config.NODE_ENV}, METRICS_STORAGE=${config.METRICS_STORAGE}`);
        return config;
    } catch (error) {
        if (error instanceof z.ZodError) {
            const missingVars = error.errors.map(err => err.path.join('.')).join(', ');
            console.error(`[CONFIG] Отсутствуют обязательные переменные окружения: ${missingVars}`);
            logger.error(`Отсутствуют обязательные переменные окружения: ${missingVars}`, {
                service: 'bot-service',
                timestamp: new Date().toISOString()
            });
            throw new Error(`Отсутствуют обязательные переменные окружения: ${missingVars}`);
        }
        throw error;
    }
}

export const config = loadConfig();