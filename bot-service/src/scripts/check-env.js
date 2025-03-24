const dotenv = require('dotenv');
const path = require('path');

// Функция для загрузки конфигурации
function loadEnv(envName) {
    const envFile = `.env.${envName}`;
    const envPath = path.resolve(process.cwd(), envFile);
    
    console.log(`Загружаем конфигурацию из файла: ${envPath}`);
    
    try {
        const result = dotenv.config({ path: envPath });
        
        if (result.error) {
            console.error(`Ошибка при загрузке конфигурации из файла ${envFile}:`, result.error.message);
            return false;
        }
        
        console.log(`Конфигурация из ${envFile} успешно загружена`);
        return true;
    } catch (error) {
        console.error(`Ошибка при загрузке конфигурации из файла ${envFile}:`, error);
        return false;
    }
}

// Проверяем NODE_ENV
console.log('Текущее значение NODE_ENV:', process.env.NODE_ENV);

// Пробуем загрузить файлы с конфигурацией для разных окружений
const envTypes = ['development', 'production', 'test'];
envTypes.forEach(env => {
    loadEnv(env);
});

// Выводим все переменные окружения, связанные с метриками
console.log('\nПеременные окружения, связанные с метриками:');
console.log('METRICS_STORAGE =', process.env.METRICS_STORAGE);
console.log('METRICS_FILE_PATH =', process.env.METRICS_FILE_PATH);

// Выводим NODE_ENV и другие важные переменные
console.log('\nДругие важные переменные окружения:');
console.log('NODE_ENV =', process.env.NODE_ENV);
console.log('MONGODB_URI =', process.env.MONGODB_URI);
console.log('MONGODB_DB_NAME =', process.env.MONGODB_DB_NAME); 