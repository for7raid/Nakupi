import MongoMetricsService from './MongoMetricsService';
import FileMetricsService from './FileMetricsService';
import { config } from '../../config/config';
import logger from '../logging/Logger';
import { MongoConnection } from '../database/MongoConnection';

// Создаем тип для объединения обоих сервисов метрик
type MetricsServiceType = MongoMetricsService | typeof FileMetricsService;

// По умолчанию используем файловый сервис метрик
let metricsService: MetricsServiceType = FileMetricsService;
logger.info('Файловый сервис метрик инициализирован по умолчанию');

/**
 * Инициализирует сервис метрик MongoDB после установки соединения с базой данных
 */
export async function initializeMongoMetrics(): Promise<MongoMetricsService> {
    try {
        // Проверяем, установлено ли соединение с MongoDB
        const mongoConnection = MongoConnection.getInstance();
        
        if (!mongoConnection.isConnected()) {
            await mongoConnection.connect();
        }
        
        logger.info('Инициализация MongoDB сервиса метрик');
        // Создаем сервис метрик без репозитория в соответствии с DDD
        const mongoMetricsService = new MongoMetricsService();
        logger.info('MongoDB сервис метрик успешно инициализирован');
        
        return mongoMetricsService;
    } catch (error) {
        logger.error('Ошибка при инициализации MongoDB сервиса метрик:', error);
        throw error;
    }
}

/**
 * Обновляет глобальный сервис метрик
 */
export function updateMetricsService(newService: MetricsServiceType): void {
    metricsService = newService;
    logger.info('Сервис метрик обновлен');
}

export default metricsService; 