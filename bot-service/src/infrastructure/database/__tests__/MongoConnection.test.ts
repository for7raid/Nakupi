import { MongoClient, Db } from 'mongodb';
import { MongoConnection } from '../MongoConnection';
import logger from '../../../infrastructure/logging/Logger';
import metricsService from '../../monitoring/Metrics';

jest.mock('mongodb', () => ({
    MongoClient: jest.fn().mockImplementation(() => ({
        connect: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
        db: jest.fn().mockReturnValue({
            collection: jest.fn()
        })
    })),
    Db: jest.fn()
}));

jest.mock('../../../infrastructure/logging/Logger');
jest.mock('../../monitoring/Metrics', () => ({
    incrementDbConnection: jest.fn(),
    incrementError: jest.fn()
}));

describe('MongoConnection', () => {
    let mockMongoClient: jest.Mocked<MongoClient>;
    let mongoConnection: MongoConnection;
    let mockDb: jest.Mocked<Db>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockMongoClient = {
            connect: jest.fn().mockResolvedValue(undefined),
            close: jest.fn().mockResolvedValue(undefined),
            db: jest.fn().mockReturnValue({
                collection: jest.fn()
            })
        } as unknown as jest.Mocked<MongoClient>;
        (MongoClient as unknown as jest.Mock).mockImplementation(() => mockMongoClient);
        mockDb = mockMongoClient.db('testdb') as jest.Mocked<Db>;
    });

    afterEach(() => {
        jest.clearAllMocks();
        (MongoConnection as any)['instance'] = null;
    });

    describe('getInstance', () => {
        it('должен создать новый экземпляр с правильными параметрами', () => {
            const instance = MongoConnection.getInstance('mongodb://localhost:27017', 'testdb');
            expect(instance).toBeDefined();
        });

        it('должен вернуть тот же экземпляр при повторном вызове', () => {
            const instance1 = MongoConnection.getInstance('mongodb://localhost:27017', 'testdb');
            const instance2 = MongoConnection.getInstance('mongodb://localhost:27017', 'testdb');
            expect(instance1).toBe(instance2);
        });
    });

    describe('connect', () => {
        beforeEach(() => {
            mongoConnection = MongoConnection.getInstance('mongodb://localhost:27017', 'testdb');
        });

        it('должен успешно установить соединение', async () => {
            await mongoConnection.connect();
            expect(mockMongoClient.connect).toHaveBeenCalled();
            expect(mockMongoClient.db).toHaveBeenCalledWith('testdb');
            expect(logger.info).toHaveBeenCalledWith('MongoDB успешно подключена');
            expect(metricsService.incrementDbConnection).toHaveBeenCalled();
        });

        it('должен вернуться без ошибки, если соединение уже установлено', async () => {
            await mongoConnection.connect();
            jest.clearAllMocks();
            await mongoConnection.connect();
            expect(logger.info).toHaveBeenCalledWith('MongoDB уже подключена');
            expect(mockMongoClient.connect).not.toHaveBeenCalled();
        });

        it('должен выбросить ошибку при неудачном подключении', async () => {
            const error = new Error('Connection failed');
            mockMongoClient.connect.mockRejectedValueOnce(error);
            await expect(mongoConnection.connect()).rejects.toThrow(error);
            expect(logger.error).toHaveBeenCalledWith('Ошибка подключения к MongoDB:', error);
            expect(metricsService.incrementError).toHaveBeenCalled();
        });
    });

    describe('disconnect', () => {
        beforeEach(() => {
            mongoConnection = MongoConnection.getInstance('mongodb://localhost:27017', 'testdb');
        });

        it('должен успешно закрыть соединение', async () => {
            await mongoConnection.connect();
            await mongoConnection.disconnect();
            expect(mockMongoClient.close).toHaveBeenCalled();
            expect(logger.info).toHaveBeenCalledWith('MongoDB отключена');
        });

        it('не должен делать ничего, если соединение не установлено', async () => {
            await mongoConnection.disconnect();
            expect(mockMongoClient.close).not.toHaveBeenCalled();
        });

        it('должен выбросить ошибку при неудачном отключении', async () => {
            await mongoConnection.connect();
            const error = new Error('Disconnect failed');
            mockMongoClient.close.mockRejectedValueOnce(error);
            await expect(mongoConnection.disconnect()).rejects.toThrow(error);
            expect(logger.error).toHaveBeenCalledWith('Ошибка отключения от MongoDB:', error);
            expect(metricsService.incrementError).toHaveBeenCalled();
        });
    });

    describe('getClient', () => {
        beforeEach(() => {
            mongoConnection = MongoConnection.getInstance('mongodb://localhost:27017', 'testdb');
        });

        it('должен вернуть клиент, если соединение установлено', async () => {
            await mongoConnection.connect();
            const client = mongoConnection.getClient();
            expect(client).toBeDefined();
            expect(client).toBe(mockMongoClient);
        });

        it('должен вернуть null, если соединение не установлено', () => {
            const client = mongoConnection.getClient();
            expect(client).toBeNull();
        });
    });

    describe('getDatabase', () => {
        beforeEach(() => {
            mongoConnection = MongoConnection.getInstance('mongodb://localhost:27017', 'testdb');
        });

        it('должен вернуть базу данных, если соединение установлено', async () => {
            await mongoConnection.connect();
            const database = mongoConnection.getDatabase();
            expect(database).toBeDefined();
        });

        it('должен вернуть null, если соединение не установлено', () => {
            const database = mongoConnection.getDatabase();
            expect(database).toBeNull();
        });
    });

    describe('getDbName', () => {
        beforeEach(() => {
            mongoConnection = MongoConnection.getInstance('mongodb://localhost:27017', 'testdb');
        });

        it('должен вернуть имя базы данных', () => {
            const dbName = mongoConnection.getDbName();
            expect(dbName).toBe('testdb');
        });
    });

    describe('isConnectedToDb', () => {
        beforeEach(() => {
            mongoConnection = MongoConnection.getInstance('mongodb://localhost:27017', 'testdb');
        });

        it('должен вернуть true, если соединение установлено', async () => {
            await mongoConnection.connect();
            expect(mongoConnection.isConnectedToDb()).toBe(true);
        });

        it('должен вернуть false, если соединение не установлено', () => {
            expect(mongoConnection.isConnectedToDb()).toBe(false);
        });
    });
}); 