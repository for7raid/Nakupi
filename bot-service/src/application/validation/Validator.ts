import { ShoppingListItem } from "../../domain/models/ShoppingListItem";
import { Category } from "../../domain/models/Category";
import { User } from "../../domain/models/User";
import logger from "../../infrastructure/logging/Logger";

export class Validator {
  public static validateShoppingListItem(item: ShoppingListItem): boolean {
    if (!item.name || item.name.trim() === '') {
      logger.warn('Попытка создать элемент списка покупок без имени', { item });
      return false;
    }

    if (!item.userId) {
      logger.warn('Попытка создать элемент списка покупок без идентификатора пользователя', { item });
      return false;
    }

    if (!item.categoryId) {
      logger.warn('Попытка создать элемент списка покупок без идентификатора категории', { item });
      return false;
    }

    if (item.quantity <= 0) {
      logger.warn('Попытка создать элемент списка покупок с некорректным количеством', { item });
      return false;
    }

    return true;
  }

  public static validateCategory(category: Category): boolean {
    if (!category.name || category.name.trim() === '') {
      logger.warn('Попытка создать категорию без имени', { category });
      return false;
    }

    if (!category.userId) {
      logger.warn('Попытка создать категорию без идентификатора пользователя', { category });
      return false;
    }

    return true;
  }

  public static validateUser(user: User): boolean {
    if (!user.id) {
      logger.warn('Попытка создать пользователя без идентификатора', { user });
      return false;
    }

    // if (!user.name || user.name.trim() === '') {
    //   logger.warn('Попытка создать пользователя без имени', { user });
    //   return false;
    // }

    return true;
  }
} 