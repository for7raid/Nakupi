import { Context, Scenes } from 'telegraf';
import { Category } from '../../../domain/entities/Category';
import { ShoppingListItem } from '../../../domain/entities/ShoppingListItem';
import { CategoryDto } from '../../../application/dto/CategoryDto';
import { ShoppingListItemDto } from '../../../application/dto/ShoppingListItemDto';

// Пользовательские данные сессии
export interface SessionData {
    userId: string;
    userName: string;
    currentCategoryId: string | { value: string };
    categories: Array<Category | CategoryDto>;
    items: Array<ShoppingListItem | ShoppingListItemDto>;
    waitingForItemInput?: boolean; // Флаг ожидания ввода элемента списка покупок
    lastBotMessageId?: number; // ID последнего сообщения от бота для его обновления
}

// Данные состояния для Scenes
export interface SceneState {
    [key: string]: any;
}

// Определяем структуру Сессии для бота
// Это объединяет нашу SessionData с Telegraf Scenes.SceneSession
export interface BotSession extends Scenes.SceneSession {
    // Наши кастомные данные
    userId: string;
    userName: string;
    currentCategoryId: string;
    categories: any[];
    items: any[];
    waitingForItemInput?: boolean;
    waitingForQuantity?: boolean;
    newItemName?: string;
}

// Расширенный контекст для бота
export interface BotContext extends Context {
    session: BotSession;
    scene: Scenes.SceneContextScene<BotContext>;
} 