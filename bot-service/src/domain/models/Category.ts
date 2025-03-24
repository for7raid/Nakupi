export interface Category {
    id?: string;          // Идентификатор категории
    userId: string;       // Идентификатор пользователя
    name: string;         // Название категории
    createdAt?: Date;     // Дата создания
}