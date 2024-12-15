import { Context } from 'telegraf';

export interface SessionData {
  selectedCategoryId?: string | null;
  isAddingCategory?: boolean;
  isAddingItem?: boolean;
  showCompletedItems?: boolean;
  lastMessageId?: number;
}

export interface BotContext extends Context {
  session: SessionData;
  match?: RegExpExecArray | null;
  message: any;
  from: any;
  callbackQuery: any;
}

export enum BotActions {
  START = 'start',
  ADD_CATEGORY = 'add_category',
  SELECT_CATEGORY = 'select_category',
  DELETE_CATEGORY = 'delete_category',
  ADD_ITEM = 'add_item',
  TOGGLE_ITEM = 'toggle_item',
  SHOW_COMPLETED = 'show_completed',
  BACK_TO_CATEGORIES = 'back_to_categories',
  BACK_TO_ITEMS = 'back_to_items',
  MANAGE_CATEGORIES = 'manage_categories'
}
