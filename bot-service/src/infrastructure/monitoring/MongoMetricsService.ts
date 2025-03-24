import { Counter, Registry } from 'prom-client';
import { MetricsRepository } from '../repositories/MetricsRepository';
import { Metric, MetricsSnapshot } from '../../domain/models/Metric';
import logger from '../logging/Logger';

export class MongoMetricsService {
  private startTime: Date;
  private activeUsers: Set<string>;
  private saveInterval: NodeJS.Timeout | null = null;
  private registry: Registry;
  private errorCounter!: Counter<string>;
  private startCommandCounter!: Counter<string>;
  private userCreatedCounter!: Counter<string>;
  private dbConnectionCounter!: Counter<string>;
  private listSavedCounter!: Counter<string>;
  private metricsRepository: MetricsRepository;

  constructor(metricsRepository: MetricsRepository) {
    this.startTime = new Date();
    this.activeUsers = new Set<string>();
    this.metricsRepository = metricsRepository;
    
    // Инициализация Prometheus клиента
    this.registry = new Registry();
    
    // Создаем метрики с проверкой их существования
    try {
      // Сначала проверяем, существуют ли метрики в реестре
      let existingMetrics: string[] = [];
      try {
        existingMetrics = this.registry.getMetricsAsArray().map(m => m.name);
      } catch (e) {
        // Игнорируем ошибку, если метрик еще нет
      }
      
      // Создаем счетчики только если они еще не существуют
      if (!existingMetrics.includes('bot_errors_total')) {
        this.errorCounter = new Counter({
          name: 'bot_errors_total',
          help: 'Общее количество ошибок',
          labelNames: ['type'],
          registers: [this.registry]
        });
      } else {
        // Получаем существующий счетчик
        this.errorCounter = this.registry.getSingleMetric('bot_errors_total') as Counter<string>;
      }

      if (!existingMetrics.includes('bot_start_commands_total')) {
        this.startCommandCounter = new Counter({
          name: 'bot_start_commands_total',
          help: 'Общее количество команд /start',
          registers: [this.registry]
        });
      } else {
        this.startCommandCounter = this.registry.getSingleMetric('bot_start_commands_total') as Counter<string>;
      }

      if (!existingMetrics.includes('bot_users_created_total')) {
        this.userCreatedCounter = new Counter({
          name: 'bot_users_created_total',
          help: 'Общее количество созданных пользователей',
          registers: [this.registry]
        });
      } else {
        this.userCreatedCounter = this.registry.getSingleMetric('bot_users_created_total') as Counter<string>;
      }

      if (!existingMetrics.includes('bot_db_connections_total')) {
        this.dbConnectionCounter = new Counter({
          name: 'bot_db_connections_total',
          help: 'Общее количество подключений к базе данных',
          registers: [this.registry]
        });
      } else {
        this.dbConnectionCounter = this.registry.getSingleMetric('bot_db_connections_total') as Counter<string>;
      }

      if (!existingMetrics.includes('bot_lists_saved_total')) {
        this.listSavedCounter = new Counter({
          name: 'bot_lists_saved_total',
          help: 'Общее количество сохраненных списков',
          registers: [this.registry]
        });
      } else {
        this.listSavedCounter = this.registry.getSingleMetric('bot_lists_saved_total') as Counter<string>;
      }
      
      logger.info('Метрики успешно инициализированы');
    } catch (error) {
      logger.error('Ошибка при инициализации метрик:', error);
    }

    // Загружаем существующие метрики из базы данных
    this.loadMetrics()
      .then(() => logger.info('Метрики успешно загружены из MongoDB'))
      .catch(error => logger.error('Ошибка при загрузке метрик из MongoDB:', error));

    // Запускаем периодическое сохранение метрик
    this.startPeriodicSave();

    logger.info('Сервис метрик MongoDB инициализирован');
    
    // Создаем начальные метрики, если они отсутствуют
    this.initializeMetrics();
  }

  private async initializeMetrics(): Promise<void> {
    try {
      // Создаем начальные метрики, если они отсутствуют
      const metricsKeys = [
        'startCommands',
        'addCategoryCommands',
        'removeCategoryCommands',
        'addItemCommands',
        'markAsPurchasedCommands',
        'markAsNotPurchasedCommands',
        'errors',
        'userCreated',
        'dbConnections',
        'listsSaved'
      ];
      
      for (const key of metricsKeys) {
        const metric = await this.metricsRepository.getMetric(key);
        if (!metric) {
          await this.metricsRepository.updateMetric(key, 0);
          logger.debug(`Создана метрика: ${key}`);
        }
      }
      
      logger.info('Начальные метрики инициализированы');
    } catch (error) {
      logger.error('Ошибка при инициализации начальных метрик:', error);
    }
  }

  private async loadMetrics(): Promise<void> {
    try {
      // Загружаем последние значения метрик из базы данных
      const startCommandsMetric = await this.metricsRepository.getMetric('startCommands');
      const addCategoryCommandsMetric = await this.metricsRepository.getMetric('addCategoryCommands');
      const removeCategoryCommandsMetric = await this.metricsRepository.getMetric('removeCategoryCommands');
      const addItemCommandsMetric = await this.metricsRepository.getMetric('addItemCommands');
      const markAsPurchasedCommandsMetric = await this.metricsRepository.getMetric('markAsPurchasedCommands');
      const markAsNotPurchasedCommandsMetric = await this.metricsRepository.getMetric('markAsNotPurchasedCommands');
      const errorsMetric = await this.metricsRepository.getMetric('errors');
      
      // Загружаем последний снимок с активными пользователями
      const latestSnapshot = await this.metricsRepository.getLatestSnapshot();
      if (latestSnapshot) {
        this.activeUsers = new Set(latestSnapshot.activeUsers);
      }
      
      logger.info('Метрики загружены из базы данных MongoDB');
    } catch (error) {
      logger.error('Ошибка при загрузке метрик из MongoDB:', error);
    }
  }

  private async saveMetricsSnapshot(): Promise<void> {
    try {
      const uptime = Math.floor((new Date().getTime() - this.startTime.getTime()) / 1000);
      
      // Получаем актуальные значения метрик из базы данных
      const startCommandsMetric = await this.metricsRepository.getMetric('startCommands');
      const addCategoryCommandsMetric = await this.metricsRepository.getMetric('addCategoryCommands');
      const removeCategoryCommandsMetric = await this.metricsRepository.getMetric('removeCategoryCommands');
      const addItemCommandsMetric = await this.metricsRepository.getMetric('addItemCommands');
      const markAsPurchasedCommandsMetric = await this.metricsRepository.getMetric('markAsPurchasedCommands');
      const markAsNotPurchasedCommandsMetric = await this.metricsRepository.getMetric('markAsNotPurchasedCommands');
      const errorsMetric = await this.metricsRepository.getMetric('errors');
      
      // Создаем снимок метрик
      const snapshot: MetricsSnapshot = {
        timestamp: new Date(),
        startCommands: startCommandsMetric?.value || 0,
        addCategoryCommands: addCategoryCommandsMetric?.value || 0,
        removeCategoryCommands: removeCategoryCommandsMetric?.value || 0,
        addItemCommands: addItemCommandsMetric?.value || 0,
        markAsPurchasedCommands: markAsPurchasedCommandsMetric?.value || 0,
        markAsNotPurchasedCommands: markAsNotPurchasedCommandsMetric?.value || 0,
        activeUsers: Array.from(this.activeUsers),
        activeUsersCount: this.activeUsers.size,
        errors: errorsMetric?.value || 0,
        uptime,
        startTime: this.startTime.toISOString()
      };
      
      // Сохраняем снимок в базу данных
      await this.metricsRepository.saveSnapshot(snapshot);
      logger.debug('Снимок метрик сохранен в MongoDB');
    } catch (error) {
      logger.error('Ошибка при сохранении снимка метрик в MongoDB:', error);
    }
  }

  private startPeriodicSave(): void {
    // Сохраняем метрики каждые 5 минут
    this.saveInterval = setInterval(() => {
      this.saveMetricsSnapshot();
    }, 5 * 60 * 1000);
  }

  public registerUser(userId: string): void {
    this.activeUsers.add(userId);
  }

  public async incrementStartCommand(): Promise<void> {
    await this.metricsRepository.incrementMetric('startCommands');
    this.startCommandCounter.inc();
    logger.debug('Увеличен счетчик команд /start');
  }

  public async incrementAddCategory(): Promise<void> {
    await this.metricsRepository.incrementMetric('addCategoryCommands');
  }

  public async incrementRemoveCategory(): Promise<void> {
    await this.metricsRepository.incrementMetric('removeCategoryCommands');
  }

  public async incrementAddItem(): Promise<void> {
    await this.metricsRepository.incrementMetric('addItemCommands');
  }

  public async incrementMarkAsPurchased(): Promise<void> {
    await this.metricsRepository.incrementMetric('markAsPurchasedCommands');
  }

  public async incrementMarkAsNotPurchased(): Promise<void> {
    await this.metricsRepository.incrementMetric('markAsNotPurchasedCommands');
  }

  public async incrementError(type: string = 'unknown'): Promise<void> {
    await this.metricsRepository.incrementMetric('errors');
    this.errorCounter.inc({ type });
    logger.debug('Увеличен счетчик ошибок', { type });
  }

  public async incrementUserCreated(): Promise<void> {
    await this.metricsRepository.incrementMetric('userCreated');
    this.userCreatedCounter.inc();
    logger.debug('Увеличен счетчик созданных пользователей');
  }

  public async incrementDbConnection(): Promise<void> {
    await this.metricsRepository.incrementMetric('dbConnections');
    this.dbConnectionCounter.inc();
    logger.debug('Увеличен счетчик подключений к базе данных');
  }

  public async incrementListSaved(): Promise<void> {
    await this.metricsRepository.incrementMetric('listsSaved');
    this.listSavedCounter.inc();
    logger.debug('Увеличен счетчик сохраненных списков');
  }

  public async getMetrics(): Promise<any> {
    const uptime = Math.floor((new Date().getTime() - this.startTime.getTime()) / 1000);
    
    // Получаем актуальные значения метрик из базы данных
    const startCommandsMetric = await this.metricsRepository.getMetric('startCommands');
    const addCategoryCommandsMetric = await this.metricsRepository.getMetric('addCategoryCommands');
    const removeCategoryCommandsMetric = await this.metricsRepository.getMetric('removeCategoryCommands');
    const addItemCommandsMetric = await this.metricsRepository.getMetric('addItemCommands');
    const markAsPurchasedCommandsMetric = await this.metricsRepository.getMetric('markAsPurchasedCommands');
    const markAsNotPurchasedCommandsMetric = await this.metricsRepository.getMetric('markAsNotPurchasedCommands');
    const errorsMetric = await this.metricsRepository.getMetric('errors');
    
    return {
      startCommands: startCommandsMetric?.value || 0,
      addCategoryCommands: addCategoryCommandsMetric?.value || 0,
      removeCategoryCommands: removeCategoryCommandsMetric?.value || 0,
      addItemCommands: addItemCommandsMetric?.value || 0,
      markAsPurchasedCommands: markAsPurchasedCommandsMetric?.value || 0,
      markAsNotPurchasedCommands: markAsNotPurchasedCommandsMetric?.value || 0,
      activeUsers: Array.from(this.activeUsers),
      activeUsersCount: this.activeUsers.size,
      errors: errorsMetric?.value || 0,
      uptime,
      startTime: this.startTime.toISOString()
    };
  }

  public async getPrometheusMetrics(): Promise<string> {
    try {
      return await this.registry.metrics();
    } catch (error) {
      logger.error('Ошибка при получении Prometheus метрик:', error);
      return '';
    }
  }

  public stop(): void {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
      this.saveMetricsSnapshot();
    }
  }
} 

export default MongoMetricsService; 