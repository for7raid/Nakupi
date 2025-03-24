export interface Metric {
    id?: string;               // MongoDB _id
    key: string;               // Ключ метрики (имя счетчика)
    value: number;             // Значение метрики
    createdAt: Date;           // Дата создания
    updatedAt: Date;           // Дата последнего обновления
}

export interface MetricsSnapshot {
    id?: string;               // MongoDB _id
    timestamp: Date;           // Время снимка
    startCommands: number;     // Количество команд /start
    addCategoryCommands: number; // Количество команд добавления категорий
    removeCategoryCommands: number; // Количество команд удаления категорий
    addItemCommands: number;   // Количество команд добавления товаров
    markAsPurchasedCommands: number; // Количество команд отметки как купленный
    markAsNotPurchasedCommands: number; // Количество команд отметки как не купленный
    activeUsers: string[];     // Активные пользователи
    activeUsersCount: number;  // Количество активных пользователей
    errors: number;            // Количество ошибок
    uptime: number;            // Время работы в секундах
    startTime: string;         // Время запуска в ISO формате
} 