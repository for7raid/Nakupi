import { Request, Response, NextFunction } from 'express';

export class HealthController {
    /**
     * Получение статуса системы
     */
    public async getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            
            res.status(200).json({
                status: 'OK',
                uptime: process.uptime(),
                timestamp: Date.now()
            });
        } catch (error) {
            next(error);
        }
    }
    
    /**
     * Получение метрик в формате Prometheus
     */
    public async getPrometheusMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const metricsService = this.getMetricsService();
            if ('getPrometheusMetrics' in metricsService) {
                const metrics = await (metricsService as any).getPrometheusMetrics();
                res.set('Content-Type', 'text/plain');
                res.status(200).send(metrics);
            } else {
                res.status(501).json({ error: 'Prometheus metrics not available' });
            }
        } catch (error) {
            next(error);
        }
    }
    
    /**
     * Получение сервиса метрик
     */
    private getMetricsService(): any {
        try {
            return require('@infrastructure/monitoring').default;
        } catch (error) {
            // В случае ошибки возвращаем заглушку сервиса метрик
            return {
                getMetrics: () => Promise.resolve({}),
                getPrometheusMetrics: () => Promise.resolve('')
            };
        }
    }
} 