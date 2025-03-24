import { Collection, Document, ObjectId } from 'mongodb';
import { Metric, MetricsSnapshot } from '../../domain/models/Metric';
import { IMetricsRepository } from '../../domain/intefaces/IMetricsRepository';
import { BaseRepository } from './BaseRepository';
import logger from '../logging/Logger';

export class MetricsRepository extends BaseRepository<Metric> implements IMetricsRepository {
    private snapshotsCollection = 'metrics_snapshots';
    private snapshotsCollectionRef: Collection<Document> | null = null;
    
    constructor() {
        super('metrics');
        // Инициализация коллекции снимков при создании экземпляра
        this.initSnapshotsCollection();
    }
    
    /**
     * Инициализирует коллекцию снимков метрик
     */
    private async initSnapshotsCollection(): Promise<void> {
        try {
            const db = this.client.db();
            if (db) {
                this.snapshotsCollectionRef = db.collection(this.snapshotsCollection);
            }
        } catch (error) {
            logger.error('Ошибка при инициализации коллекции снимков метрик:', error);
        }
    }
    
    /**
     * Возвращает коллекцию снимков метрик
     */
    private async getSnapshotsCollection(): Promise<Collection<Document>> {
        if (!this.snapshotsCollectionRef) {
            const db = this.client.db();
            if (!db) {
                throw new Error('База данных не инициализирована');
            }
            this.snapshotsCollectionRef = db.collection(this.snapshotsCollection);
        }
        return this.snapshotsCollectionRef;
    }
    
    async getMetric(key: string): Promise<Metric | null> {
        try {
            return await this.collection.findOne({ key });
        } catch (error) {
            logger.error('Ошибка при получении метрики:', error);
            throw error;
        }
    }
    
    async updateMetric(key: string, value: number): Promise<void> {
        try {
            const now = new Date();
            await this.collection.updateOne(
                { key },
                { 
                    $set: { 
                        value,
                        updatedAt: now
                    },
                    $setOnInsert: { 
                        createdAt: now 
                    }
                },
                { upsert: true }
            );
        } catch (error) {
            logger.error('Ошибка при обновлении метрики:', error);
            throw error;
        }
    }
    
    async incrementMetric(key: string): Promise<void> {
        try {
            const now = new Date();
            await this.collection.updateOne(
                { key },
                { 
                    $inc: { value: 1 },
                    $set: { updatedAt: now },
                    $setOnInsert: { createdAt: now }
                },
                { upsert: true }
            );
        } catch (error) {
            logger.error('Ошибка при увеличении метрики:', error);
            throw error;
        }
    }
    
    async getAllMetrics(): Promise<Metric[]> {
        try {
            return await this.collection.find().toArray();
        } catch (error) {
            logger.error('Ошибка при получении всех метрик:', error);
            throw error;
        }
    }
    
    async saveSnapshot(snapshot: MetricsSnapshot): Promise<void> {
        try {
            // Добавляем временную метку, если не указана
            if (!snapshot.timestamp) {
                snapshot.timestamp = new Date();
            }
            
            const snapshotsCollection = await this.getSnapshotsCollection();
            await snapshotsCollection.insertOne(snapshot);
            logger.debug('Снимок метрик сохранен в базу данных');
        } catch (error) {
            logger.error('Ошибка при сохранении снимка метрик:', error);
            throw error;
        }
    }
    
    async getLatestSnapshot(): Promise<MetricsSnapshot | null> {
        try {
            // Получаем последний снимок метрик, сортируя по timestamp в обратном порядке
            const snapshotsCollection = await this.getSnapshotsCollection();
            const snapshot = await snapshotsCollection
                .find()
                .sort({ timestamp: -1 })
                .limit(1)
                .toArray();
                
            if (snapshot.length === 0) {
                return null;
            }

            // Преобразуем документ MongoDB в интерфейс MetricsSnapshot
            const doc = snapshot[0];
            return {
                id: doc._id?.toString(),
                timestamp: doc.timestamp,
                startCommands: doc.startCommands,
                addCategoryCommands: doc.addCategoryCommands,
                removeCategoryCommands: doc.removeCategoryCommands,
                addItemCommands: doc.addItemCommands,
                markAsPurchasedCommands: doc.markAsPurchasedCommands,
                markAsNotPurchasedCommands: doc.markAsNotPurchasedCommands,
                activeUsers: doc.activeUsers,
                activeUsersCount: doc.activeUsersCount,
                errors: doc.errors,
                uptime: doc.uptime,
                startTime: doc.startTime
            } as MetricsSnapshot;
        } catch (error) {
            logger.error('Ошибка при получении последнего снимка метрик:', error);
            throw error;
        }
    }
    
    async getSnapshotsByDateRange(startDate: Date, endDate: Date): Promise<MetricsSnapshot[]> {
        try {
            const snapshotsCollection = await this.getSnapshotsCollection();
            const documents = await snapshotsCollection
                .find({ 
                    timestamp: { 
                        $gte: startDate, 
                        $lte: endDate 
                    } 
                })
                .sort({ timestamp: 1 })
                .toArray();
            
            // Преобразуем документы MongoDB в интерфейсы MetricsSnapshot
            return documents.map((doc: Document) => ({
                id: doc._id?.toString(),
                timestamp: doc.timestamp,
                startCommands: doc.startCommands,
                addCategoryCommands: doc.addCategoryCommands,
                removeCategoryCommands: doc.removeCategoryCommands,
                addItemCommands: doc.addItemCommands,
                markAsPurchasedCommands: doc.markAsPurchasedCommands,
                markAsNotPurchasedCommands: doc.markAsNotPurchasedCommands,
                activeUsers: doc.activeUsers,
                activeUsersCount: doc.activeUsersCount,
                errors: doc.errors,
                uptime: doc.uptime,
                startTime: doc.startTime
            } as MetricsSnapshot));
        } catch (error) {
            logger.error('Ошибка при получении снимков метрик за период:', error);
            throw error;
        }
    }
} 