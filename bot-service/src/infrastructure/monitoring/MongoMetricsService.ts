import { Counter, Registry } from 'prom-client';
import logger from '../logging/Logger';
import { MongoConnection } from '../database/MongoConnection';

/**
 * Интерфейс для снимка метрик
 */
interface MetricsSnapshot {
  timestamp: Date;
  startCommands: number;
  addCategoryCommands: number;
  removeCategoryCommands: number;
  addItemCommands: number;
  markAsPurchasedCommands: number;
  markAsNotPurchasedCommands: number;
  activeUsers: string[];
  activeUsersCount: number;
  errors: number;
  uptime: number;
  startTime: string;
}

export default class MongoMetricsService {
  private startTime: Date;
  private activeUsers: Set<string>;
  private saveInterval: NodeJS.Timeout | null = null;
  private registry: Registry;
  private errorCounter!: Counter<string>;
  private startCommandCounter!: Counter<string>;
  private userCreatedCounter!: Counter<string>;
  private dbConnectionCounter!: Counter<string>;
  private listSavedCounter!: Counter<string>;
  private mongoConnection: MongoConnection;
  private metrics: Map<string, number> = new Map();

  constructor() {
    this.startTime = new Date();
    this.activeUsers = new Set<string>();
    this.mongoConnection = MongoConnection.getInstance();
    
    // Инициализация Prometheus клиента
    this.registry = new Registry();
    
    // Создаем метрики
    this.initializePrometheusMetrics();

    // Загружаем существующие метрики из базы данных
    this.loadMetrics()
      .then(() => logger.info('Метрики успешно загружены из MongoDB'))
      .catch(error => logger.error('Ошибка при загрузке метрик из MongoDB:', error));

    // Запускаем периодическое сохранение метрик
    this.startPeriodicSave();

    logger.info('Сервис метрик MongoDB инициализирован');
    
    // Инициализируем начальные метрики
    this.initializeMetrics();
  }

  private initializePrometheusMetrics(): void {
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
      
      logger.info('Метрики Prometheus успешно инициализированы');
    } catch (error) {
      logger.error('Ошибка при инициализации метрик Prometheus:', error);
    }
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
        if (!this.metrics.has(key)) {
          this.metrics.set(key, 0);
          await this.updateMetric(key, 0);
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
      // Загружаем метрики из базы данных
      const collection = await this.mongoConnection.getCollection('metrics');
      const metrics = await collection.find().toArray();
      
      for (const metric of metrics) {
        this.metrics.set(metric.name, metric.value);
      }
      
      // Загружаем последний снимок с активными пользователями
      const snapshotsCollection = await this.mongoConnection.getCollection('metricsSnapshots');
      const latestSnapshot = await snapshotsCollection.findOne({}, { sort: { timestamp: -1 } });
      
      if (latestSnapshot) {
        this.activeUsers = new Set(latestSnapshot.activeUsers);
      }
      
      logger.info('Метрики загружены из базы данных MongoDB');
    } catch (error) {
      logger.error('Ошибка при загрузке метрик из MongoDB:', error);
    }
  }

  private async updateMetric(name: string, value: number): Promise<void> {
    try {
      const collection = await this.mongoConnection.getCollection('metrics');
      await collection.updateOne(
        { name },
        { $set: { name, value, updatedAt: new Date() } },
        { upsert: true }
      );
      this.metrics.set(name, value);
    } catch (error) {
      logger.error(`Ошибка при обновлении метрики ${name}:`, error);
    }
  }

  private async incrementMetric(name: string): Promise<void> {
    try {
      const currentValue = this.metrics.get(name) || 0;
      const newValue = currentValue + 1;
      await this.updateMetric(name, newValue);
    } catch (error) {
      logger.error(`Ошибка при инкрементировании метрики ${name}:`, error);
    }
  }

  private async getMetric(name: string): Promise<number> {
    return this.metrics.get(name) || 0;
  }

  private async saveMetricsSnapshot(): Promise<void> {
    try {
      const uptime = Math.floor((new Date().getTime() - this.startTime.getTime()) / 1000);
      
      // Создаем снимок метрик
      const snapshot: MetricsSnapshot = {
        timestamp: new Date(),
        startCommands: await this.getMetric('startCommands'),
        addCategoryCommands: await this.getMetric('addCategoryCommands'),
        removeCategoryCommands: await this.getMetric('removeCategoryCommands'),
        addItemCommands: await this.getMetric('addItemCommands'),
        markAsPurchasedCommands: await this.getMetric('markAsPurchasedCommands'),
        markAsNotPurchasedCommands: await this.getMetric('markAsNotPurchasedCommands'),
        activeUsers: Array.from(this.activeUsers),
        activeUsersCount: this.activeUsers.size,
        errors: await this.getMetric('errors'),
        uptime,
        startTime: this.startTime.toISOString()
      };
      
      // Сохраняем снимок в базу данных
      const snapshotsCollection = await this.mongoConnection.getCollection('metricsSnapshots');
      await snapshotsCollection.insertOne(snapshot);
      
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
    await this.incrementMetric('startCommands');
    this.startCommandCounter.inc();
    logger.debug('Увеличен счетчик команд /start');
  }

  public async incrementAddCategory(): Promise<void> {
    await this.incrementMetric('addCategoryCommands');
  }

  public async incrementRemoveCategory(): Promise<void> {
    await this.incrementMetric('removeCategoryCommands');
  }

  public async incrementAddItem(): Promise<void> {
    await this.incrementMetric('addItemCommands');
  }

  public async incrementMarkAsPurchased(): Promise<void> {
    await this.incrementMetric('markAsPurchasedCommands');
  }

  public async incrementMarkAsNotPurchased(): Promise<void> {
    await this.incrementMetric('markAsNotPurchasedCommands');
  }

  public async incrementError(type: string = 'unknown'): Promise<void> {
    await this.incrementMetric('errors');
    this.errorCounter.inc({ type });
    logger.debug('Увеличен счетчик ошибок', { type });
  }

  public async incrementUserCreated(): Promise<void> {
    await this.incrementMetric('userCreated');
    this.userCreatedCounter.inc();
    logger.debug('Увеличен счетчик созданных пользователей');
  }

  public async incrementDbConnection(): Promise<void> {
    await this.incrementMetric('dbConnections');
    this.dbConnectionCounter.inc();
    logger.debug('Увеличен счетчик подключений к базе данных');
  }

  public async incrementListSaved(): Promise<void> {
    await this.incrementMetric('listsSaved');
    this.listSavedCounter.inc();
    logger.debug('Увеличен счетчик сохраненных списков');
  }

  public async getMetrics(): Promise<any> {
    const uptime = Math.floor((new Date().getTime() - this.startTime.getTime()) / 1000);
    return {
      startTime: this.startTime,
      uptime,
      activeUsers: this.activeUsers.size,
      startCommands: await this.getMetric('startCommands'),
      addCategoryCommands: await this.getMetric('addCategoryCommands'),
      removeCategoryCommands: await this.getMetric('removeCategoryCommands'),
      addItemCommands: await this.getMetric('addItemCommands'),
      markAsPurchasedCommands: await this.getMetric('markAsPurchasedCommands'),
      markAsNotPurchasedCommands: await this.getMetric('markAsNotPurchasedCommands'),
      errors: await this.getMetric('errors'),
      userCreated: await this.getMetric('userCreated'),
      dbConnections: await this.getMetric('dbConnections'),
      listsSaved: await this.getMetric('listsSaved')
    };
  }

  public async getPrometheusMetrics(): Promise<string> {
    try {
      return await this.registry.metrics();
    } catch (error) {
      logger.error('Ошибка при получении метрик Prometheus:', error);
      return '';
    }
  }

  public stop(): void {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
      this.saveInterval = null;
    }
    
    // Сохраняем последний снимок перед остановкой
    this.saveMetricsSnapshot()
      .then(() => logger.info('Последний снимок метрик сохранен при остановке'))
      .catch(error => logger.error('Ошибка при сохранении последнего снимка метрик:', error));
  }
} 