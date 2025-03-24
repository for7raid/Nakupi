export interface User {
    id: string;                // Идентификатор пользователя (telegramId)
    name: string;              // Имя пользователя
    registrationDate?: Date;   // Дата регистрации
    lastActionDate?: Date;     // Дата последнего действия
}