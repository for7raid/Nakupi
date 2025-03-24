import fs from 'fs';
import path from 'path';
import logger from '../logging/Logger';
import { Counter, Registry } from 'prom-client';

class FileMetricsService {
    private metricsDir: string = 'metrics';
    private metricsFilePath: string;
    private saveInterval: NodeJS.Timeout | null = null;
    private metrics: {
        startCommands: number;
        addCategoryCommands: number;
        removeCategoryCommands: number;
        addItemCommands: number;
        markAsPurchasedCommands: number;
        markAsNotPurchasedCommands: number;
        activeUsers: Set<string | number>;
        errors: number;
        startTime: Date;
    };

    // Prometheus метрики
    private registry: Registry;
    private errorCounter: Counter<string>;
    private startCommandCounter: Counter<string>;
    private userCreatedCounter: Counter<string>;
    private dbConnectionCounter: Counter<string>;
    private listSavedCounter: Counter<string>;

    constructor() {
        this.metrics = {
            startCommands: 0,
            addCategoryCommands: 0,
            removeCategoryCommands: 0,
            addItemCommands: 0,
            markAsPurchasedCommands: 0,
            markAsNotPurchasedCommands: 0,
            activeUsers: new Set(),
            errors: 0,
            startTime: new Date()
        };

        // Создаем директорию для метрик, если она отсутствует
        if (!fs.existsSync(this.metricsDir)) {
            fs.mkdirSync(this.metricsDir);
        }

        this.metricsFilePath = path.join(this.metricsDir, 'bot_metrics.json');
        this.loadMetrics();
        this.startPeriodicSave();

        this.registry = new Registry();
        this.errorCounter = new Counter({
            name: 'bot_errors_total',
            help: 'Общее количество ошибок',
            labelNames: ['type']
        });

        this.startCommandCounter = new Counter({
            name: 'bot_start_commands_total',
            help: 'Общее количество команд /start'
        });

        this.userCreatedCounter = new Counter({
            name: 'bot_users_created_total',
            help: 'Общее количество созданных пользователей'
        });

        this.dbConnectionCounter = new Counter({
            name: 'bot_db_connections_total',
            help: 'Общее количество подключений к базе данных'
        });

        this.listSavedCounter = new Counter({
            name: 'bot_lists_saved_total',
            help: 'Общее количество сохраненных списков'
        });

        this.registry.registerMetric(this.errorCounter);
        this.registry.registerMetric(this.startCommandCounter);
        this.registry.registerMetric(this.userCreatedCounter);
        this.registry.registerMetric(this.dbConnectionCounter);
        this.registry.registerMetric(this.listSavedCounter);

        logger.info('Сервис метрик инициализирован');
    }

    private loadMetrics(): void {
        try {
            if (fs.existsSync(this.metricsFilePath)) {
                const data = fs.readFileSync(this.metricsFilePath, 'utf8');
                const loadedMetrics = JSON.parse(data);

                // Восстанавливаем счетчики метрик
                this.metrics.startCommands = loadedMetrics.startCommands || 0;
                this.metrics.addCategoryCommands = loadedMetrics.addCategoryCommands || 0;
                this.metrics.removeCategoryCommands = loadedMetrics.removeCategoryCommands || 0;
                this.metrics.addItemCommands = loadedMetrics.addItemCommands || 0;
                this.metrics.markAsPurchasedCommands = loadedMetrics.markAsPurchasedCommands || 0;
                this.metrics.markAsNotPurchasedCommands = loadedMetrics.markAsNotPurchasedCommands || 0;
                this.metrics.errors = loadedMetrics.errors || 0;

                // Восстанавливаем Set активных пользователей
                this.metrics.activeUsers = new Set(loadedMetrics.activeUsers || []);

                logger.info('Метрики загружены из файла', { filePath: this.metricsFilePath });
            }
        } catch (error) {
            logger.error('Ошибка при загрузке метрик из файла:', error);
        }
    }

    private saveMetrics(): void {
        try {
            // Преобразуем Set в массив для сохранения в JSON
            const metricsToSave = {
                ...this.metrics,
                activeUsers: Array.from(this.metrics.activeUsers)
            };
            fs.writeFileSync(this.metricsFilePath, JSON.stringify(metricsToSave, null, 2));
            logger.debug('Метрики сохранены в файл', { filePath: this.metricsFilePath });
        } catch (error) {
            logger.error('Ошибка при сохранении метрик в файл:', error);
        }
    }

    private startPeriodicSave(): void {
        // Сохраняем метрики каждые 5 минут
        this.saveInterval = setInterval(() => {
            this.saveMetrics();
        }, 5 * 60 * 1000);
    }

    public registerUser(userId: string | number): void {
        this.metrics.activeUsers.add(userId);
    }

    public incrementStartCommand(): void {
        this.metrics.startCommands++;
        this.startCommandCounter.inc();
        logger.debug('Увеличен счетчик команд /start');
    }

    public incrementAddCategory(): void {
        this.metrics.addCategoryCommands++;
    }

    public incrementRemoveCategory(): void {
        this.metrics.removeCategoryCommands++;
    }

    public incrementAddItem(): void {
        this.metrics.addItemCommands++;
    }

    public incrementMarkAsPurchased(): void {
        this.metrics.markAsPurchasedCommands++;
    }

    public incrementMarkAsNotPurchased(): void {
        this.metrics.markAsNotPurchasedCommands++;
    }

    public incrementError(type: string = 'unknown'): void {
        this.metrics.errors++;
        this.errorCounter.inc({ type });
        logger.debug('Увеличен счетчик ошибок', { type });
    }

    public incrementUserCreated(): void {
        this.userCreatedCounter.inc();
        logger.debug('Увеличен счетчик созданных пользователей');
    }

    public incrementDbConnection(): void {
        this.dbConnectionCounter.inc();
        logger.debug('Увеличен счетчик подключений к базе данных');
    }

    public incrementListSaved(): void {
        this.listSavedCounter.inc();
        logger.debug('Увеличен счетчик сохраненных списков');
    }

    public getMetrics() {
        const uptime = Math.floor((new Date().getTime() - this.metrics.startTime.getTime()) / 1000);
        return {
            ...this.metrics,
            activeUsersCount: this.metrics.activeUsers.size,
            uptime: uptime,
            startTime: this.metrics.startTime.toISOString()
        };
    }

    public async getPrometheusMetrics(): Promise<string> {
        try {
            return await this.registry.metrics();
        } catch (error) {
            logger.error('Ошибка при получении метрик:', error);
            return '';
        }
    }

    public stop(): void {
        if (this.saveInterval) {
            clearInterval(this.saveInterval);
            this.saveMetrics();
        }
    }
}

// Создаем singleton экземпляр
const metricsService = new FileMetricsService();

// Обработка выхода из приложения
process.on('exit', () => {
    metricsService.stop();
});

export default metricsService; 