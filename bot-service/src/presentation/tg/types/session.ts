import { Context, Scenes } from 'telegraf';
import { Category } from '../../../domain/models/Category';
import { ShoppingListItem } from '../../../domain/models/ShoppingListItem';

// Интерфейс для данных сессии
export interface SessionData {
    userId: string | null;
    userName: string | null;
    currentCategoryId: string | null;
    categories: Category[];
    items: ShoppingListItem[];
    waitingForItemInput?: boolean; // Флаг ожидания ввода элемента списка покупок
}

// Интерфейс для сцены
export interface SceneSessionData extends Scenes.SceneSession {
    state: SessionData;
}

// Расширенный контекст для бота
export interface BotContext extends Context {
    session: Scenes.SceneSession & SessionData;
    scene: Scenes.SceneContextScene<BotContext>;
} 