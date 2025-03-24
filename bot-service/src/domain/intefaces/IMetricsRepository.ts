import { Metric, MetricsSnapshot } from '../models/Metric';

export interface IMetricsRepository {
    /**
     * Получить метрику по ключу
     * @param key Ключ метрики
     */
    getMetric(key: string): Promise<Metric | null>;
    
    /**
     * Создать или обновить метрику
     * @param key Ключ метрики
     * @param value Значение метрики
     */
    updateMetric(key: string, value: number): Promise<void>;
    
    /**
     * Увеличить значение метрики на 1
     * @param key Ключ метрики
     */
    incrementMetric(key: string): Promise<void>;
    
    /**
     * Получить все метрики
     */
    getAllMetrics(): Promise<Metric[]>;
    
    /**
     * Сохранить снимок всех метрик
     * @param snapshot Снимок метрик
     */
    saveSnapshot(snapshot: MetricsSnapshot): Promise<void>;
    
    /**
     * Получить последний снимок метрик
     */
    getLatestSnapshot(): Promise<MetricsSnapshot | null>;
    
    /**
     * Получить снимки метрик за период
     * @param startDate Начальная дата
     * @param endDate Конечная дата
     */
    getSnapshotsByDateRange(startDate: Date, endDate: Date): Promise<MetricsSnapshot[]>;
} 