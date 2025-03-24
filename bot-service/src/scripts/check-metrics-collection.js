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

async function checkMetricsCollection() {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB_NAME;
    
    console.log(`Подключаемся к MongoDB по адресу: ${uri}`);
    console.log(`Используемая база данных: ${dbName}`);
    
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        console.log('Успешно подключились к MongoDB');
        
        const db = client.db(dbName);
        
        // Получаем коллекции в базе данных
        const collections = await db.listCollections().toArray();
        console.log('\nКоллекции в базе данных:');
        collections.forEach(collection => {
            console.log(` - ${collection.name}`);
        });
        
        // Проверяем, существует ли коллекция метрик
        const hasMetricsCollection = collections.some(c => c.name === 'metrics');
        console.log(`\nКоллекция metrics ${hasMetricsCollection ? 'существует' : 'не существует'}`);
        
        if (hasMetricsCollection) {
            // Проверяем содержимое коллекции метрик
            const metricsCollection = db.collection('metrics');
            const metrics = await metricsCollection.find({}).toArray();
            
            console.log('\nТекущие метрики в коллекции metrics:');
            metrics.forEach(metric => {
                console.log(`Метрика: ${metric.key}, Значение: ${metric.value}, Последнее обновление: ${metric.updatedAt}`);
            });

            // Проверяем, есть ли снимки метрик
            const hasSnapshotsCollection = collections.some(c => c.name === 'metrics_snapshots');
            console.log(`\nКоллекция metrics_snapshots ${hasSnapshotsCollection ? 'существует' : 'не существует'}`);
            
            if (hasSnapshotsCollection) {
                const snapshotsCollection = db.collection('metrics_snapshots');
                const snapshots = await snapshotsCollection.find({}).sort({ timestamp: -1 }).limit(1).toArray();
                
                if (snapshots.length > 0) {
                    console.log('\nПоследний снимок метрик:');
                    console.log(` - Время создания: ${snapshots[0].timestamp}`);
                    console.log(` - Активные пользователи: ${snapshots[0].activeUsersCount}`);
                    console.log(` - Количество запусков: ${snapshots[0].startCommands}`);
                } else {
                    console.log('\nСнимки метрик отсутствуют');
                }
            }
        }
        
    } catch (error) {
        console.error('Ошибка при работе с MongoDB:', error);
    } finally {
        await client.close();
        console.log('\nСоединение с MongoDB закрыто');
    }
}

// Запускаем проверку
checkMetricsCollection().catch(console.error); 