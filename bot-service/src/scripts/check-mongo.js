const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

// Загружаем переменные окружения
const env = process.env.NODE_ENV || 'production';
const envFile = `.env.${env}`;
const envPath = path.resolve(process.cwd(), envFile);

console.log(`Загружаем конфигурацию из файла: ${envPath}`);
dotenv.config({ path: envPath });

// Получаем URI и имя базы данных из переменных окружения
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DB_NAME || 'nakupi_prod';

async function main() {
    console.log(`Подключаемся к MongoDB по адресу: ${uri}`);
    console.log(`Имя базы данных: ${dbName}`);
    
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        console.log('Успешно подключились к MongoDB');
        
        const db = client.db(dbName);
        
        // Получаем список коллекций
        const collections = await db.listCollections().toArray();
        console.log('Коллекции в базе данных:');
        collections.forEach(collection => {
            console.log(` - ${collection.name}`);
        });
        
        // Проверяем, существует ли коллекция метрик
        const hasMetricsCollection = collections.some(c => c.name === 'metrics');
        console.log(`Коллекция метрик ${hasMetricsCollection ? 'существует' : 'не существует'}`);
        
        // Если коллекция существует, выводим ее содержимое
        if (hasMetricsCollection) {
            const metrics = await db.collection('metrics').find({}).toArray();
            console.log('\nСодержимое коллекции metrics:');
            console.log(JSON.stringify(metrics, null, 2));
        }
        
    } catch (error) {
        console.error('Ошибка при работе с MongoDB:', error);
    } finally {
        await client.close();
        console.log('Соединение с MongoDB закрыто');
    }
}

main().catch(console.error); 