const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

// Устанавливаем переменную окружения NODE_ENV в production
process.env.NODE_ENV = 'production';

// Загружаем переменные окружения из .env.production
const envPath = path.resolve(process.cwd(), '.env.production');
console.log(`Загружаем конфигурацию из файла: ${envPath}`);

const result = dotenv.config({ path: envPath });
if (result.error) {
    console.error(`Ошибка при загрузке конфигурации:`, result.error);
    process.exit(1);
}

// Выводим загруженные переменные окружения
console.log('Загруженные переменные окружения:');
console.log(`NODE_ENV = ${process.env.NODE_ENV}`);
console.log(`METRICS_STORAGE = ${process.env.METRICS_STORAGE}`);
console.log(`MONGODB_URI = ${process.env.MONGODB_URI}`);
console.log(`MONGODB_DB_NAME = ${process.env.MONGODB_DB_NAME}`);

// Функция для подключения к MongoDB и работы с метриками
async function testMongoMetrics() {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB_NAME;
    
    console.log(`Подключаемся к MongoDB по адресу: ${uri}`);
    console.log(`Используемая база данных: ${dbName}`);
    
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        console.log('Успешно подключились к MongoDB');
        
        const db = client.db(dbName);
        
        // Создаем коллекцию metrics, если она не существует
        try {
            await db.createCollection('metrics');
            console.log('Коллекция metrics успешно создана');
        } catch (error) {
            if (error.codeName === 'NamespaceExists') {
                console.log('Коллекция metrics уже существует');
            } else {
                console.error('Ошибка при создании коллекции metrics:', error);
            }
        }
        
        // Создаем тестовые метрики
        const metricsCollection = db.collection('metrics');
        
        const testMetrics = [
            { key: 'startCommands', value: 10, createdAt: new Date(), updatedAt: new Date() },
            { key: 'addItemCommands', value: 5, createdAt: new Date(), updatedAt: new Date() },
            { key: 'errors', value: 2, createdAt: new Date(), updatedAt: new Date() }
        ];
        
        // Обновляем метрики с upsert
        for (const metric of testMetrics) {
            await metricsCollection.updateOne(
                { key: metric.key },
                { 
                    $set: { 
                        value: metric.value,
                        updatedAt: metric.updatedAt
                    },
                    $setOnInsert: { 
                        createdAt: metric.createdAt 
                    }
                },
                { upsert: true }
            );
            console.log(`Метрика ${metric.key} успешно обновлена/создана`);
        }
        
        // Проверяем, что метрики были сохранены
        const savedMetrics = await metricsCollection.find({}).toArray();
        console.log('\nСохраненные метрики:');
        console.log(JSON.stringify(savedMetrics, null, 2));
        
        // Создаем коллекцию snapshots
        try {
            await db.createCollection('metrics_snapshots');
            console.log('Коллекция metrics_snapshots успешно создана');
        } catch (error) {
            if (error.codeName === 'NamespaceExists') {
                console.log('Коллекция metrics_snapshots уже существует');
            } else {
                console.error('Ошибка при создании коллекции metrics_snapshots:', error);
            }
        }
        
        // Создаем тестовый снимок метрик
        const snapshotsCollection = db.collection('metrics_snapshots');
        
        const testSnapshot = {
            timestamp: new Date(),
            startCommands: 10,
            addCategoryCommands: 3,
            removeCategoryCommands: 1,
            addItemCommands: 5,
            markAsPurchasedCommands: 7,
            markAsNotPurchasedCommands: 2,
            activeUsers: ['user1', 'user2', 'user3'],
            activeUsersCount: 3,
            errors: 2,
            uptime: 3600,
            startTime: new Date(Date.now() - 3600000).toISOString()
        };
        
        // Сохраняем снимок
        await snapshotsCollection.insertOne(testSnapshot);
        console.log('Тестовый снимок метрик успешно сохранен');
        
        // Получаем коллекции в базе данных
        const collections = await db.listCollections().toArray();
        console.log('\nКоллекции в базе данных:');
        collections.forEach(collection => {
            console.log(` - ${collection.name}`);
        });
        
    } catch (error) {
        console.error('Ошибка при работе с MongoDB:', error);
    } finally {
        await client.close();
        console.log('Соединение с MongoDB закрыто');
    }
}

// Запускаем тестирование
testMongoMetrics().catch(console.error); 