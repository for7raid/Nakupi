export interface ShoppingListItem {
    id?: string;           // Идентификатор элемента
    name: string;          // Название элемента
    userId: string;        // Идентификатор пользователя
    categoryId: string;    // Идентификатор категории
    quantity: number;      // Количество
    purchased: boolean;    // Статус покупки
    createdAt?: Date;      // Дата создания
    purchasedDate?: Date;  // Дата покупки
}