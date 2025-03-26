export interface User {
    id?: string;          // Уникальный идентификатор пользователя
    email: string;        // Email пользователя
    name?: string;        // Имя пользователя (опционально)
    createdAt?: string;   // Дата и время создания записи
    updatedAt?: string;   // Дата и время последнего обновления записи
    registrationDate?: string;  // Дата регистрации пользователя
    lastActionDate?: string;    // Дата последнего действия пользователя
}

export interface Status {
    status: string;       // Текущий статус сервиса
    uptime: number;       // Время работы сервиса в секундах
    timestamp: number;    // Временная метка проверки статуса
}

export interface Category {
    id?: string;          // Уникальный идентификатор категории
    userId: string;       // ID пользователя, создавшего категорию
    name: string;         // Название категории
    createdAt?: string;   // Дата и время создания записи
    updatedAt?: string;   // Дата и время последнего обновления записи
    isShared?: boolean;   // Флаг, указывающий является ли категория общей
    isOwner?: boolean;    // Флаг, указывающий является ли пользователь владельцем категории
    linkedCategoryId?: string;  // ID связанной категории (для общих категорий)
}

export interface CategoryAccess {
    userId: string;       // ID пользователя
    categoryId: string;   // ID категории
    username?: string;    // Имя пользователя (опционально)
    isOwner: boolean;     // Флаг, указывающий является ли пользователь владельцем
}

export interface ShareCode {
    code: string;         // Код для доступа к категории
    categoryId: string;   // ID категории, к которой предоставляется доступ
    userId: string;       // ID пользователя, создавшего код
    expiresAt?: string;   // Дата истечения срока действия кода
}

export interface ShoppingListItem {
    id?: string;           // Уникальный идентификатор товара
    name: string;         // Название товара
    userId: string;       // ID пользователя, которому принадлежит товар
    categoryId: string;   // ID категории, к которой относится товар
    quantity: number;     // Количество товара
    purchased: boolean;   // Флаг, указывающий куплен ли товар
    createdAt?: string;   // Дата и время создания записи
    purchasedDate?: string; // Дата и время покупки товара
}

export interface TelegramWebAppUser {
    id: number;           // ID пользователя в Telegram
    first_name: string;   // Имя пользователя
    last_name?: string;   // Фамилия пользователя (опционально)
    username?: string;    // Имя пользователя в Telegram (опционально)
    language_code?: string; // Код языка пользователя (опционально)
}

export interface TelegramWebApp {
    close: () => void;    // Функция для закрытия веб-приложения
    expand: () => void;   // Функция для разворачивания веб-приложения
    ready: () => void;    // Функция для уведомления о готовности приложения
    isExpanded: boolean;  // Флаг, указывающий развернуто ли приложение
    colorScheme: 'light' | 'dark';  // Текущая цветовая схема
    setHeaderColor: (color: string) => void;  // Функция для установки цвета заголовка
    setBackgroundColor: (color: string) => void;  // Функция для установки цвета фона
    initDataUnsafe: {     // Данные инициализации приложения
        user?: {          // Информация о пользователе
            id: number;    // ID пользователя
            first_name: string;  // Имя пользователя
            last_name?: string;  // Фамилия пользователя (опционально)
            username?: string;   // Имя пользователя в Telegram (опционально)
        };
        start_param?: string;    // Параметр запуска приложения (опционально)
    };
} 