import { MongoClient, Db } from 'mongodb';
import logger from '../logging/Logger';
import metricsService from '../monitoring';

export class MongoConnection {
    private static instance: MongoConnection;
    private client: MongoClient | null = null;
    private db: Db | null = null;
    private uri: string;
    private dbName: string;

    private constructor(uri: string, dbName: string) {
        this.uri = uri;
        this.dbName = dbName;
    }

    public static getInstance(uri: string, dbName: string): MongoConnection {
        if (!MongoConnection.instance) {
            MongoConnection.instance = new MongoConnection(uri, dbName);
        }
        return MongoConnection.instance;
    }

    public async connect(): Promise<void> {
        try {
            if (this.client) {
                logger.info('MongoDB уже подключена');
                return;
            }

            this.client = new MongoClient(this.uri);
            await this.client.connect();
            this.db = this.client.db(this.dbName);
            
            logger.info('MongoDB успешно подключена');
            metricsService.incrementDbConnection();
        } catch (error) {
            logger.error('Ошибка подключения к MongoDB:', error);
            metricsService.incrementError();
            throw error;
        }
    }

    public async disconnect(): Promise<void> {
        try {
            if (this.client) {
                await this.client.close();
                this.client = null;
                this.db = null;
                logger.info('MongoDB отключена');
            }
        } catch (error) {
            logger.error('Ошибка отключения от MongoDB:', error);
            metricsService.incrementError();
            throw error;
        }
    }

    public getClient(): MongoClient | null {
        return this.client;
    }

    public getDatabase(): Db | null {
        return this.db;
    }

    public getDbName(): string {
        return this.dbName;
    }

    public isConnectedToDb(): boolean {
        return this.client !== null && this.db !== null;
    }
}