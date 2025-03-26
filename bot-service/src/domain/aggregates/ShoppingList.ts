import { DomainException } from '../exceptions/DomainException';
import { ShoppingListItem } from '../entities/ShoppingListItem';
import { Category } from '../entities/Category';
import { UserId } from '../value-objects/UserId';
import { CategoryId } from '../value-objects/CategoryId';
import { ItemId } from '../value-objects/ItemId';
import { Quantity } from '../value-objects/Quantity';

/**
 * Агрегат Список покупок.
 * Корневой объект агрегата, который управляет списком категорий и элементов покупок для пользователя.
 */
export class ShoppingList {
    private _userId: UserId;
    private _categories: Map<string, Category>;
    private _items: Map<string, ShoppingListItem>;

    constructor(userId: UserId) {
        this._userId = userId;
        this._categories = new Map<string, Category>();
        this._items = new Map<string, ShoppingListItem>();
    }

    /**
     * Создает новый агрегат списка покупок для пользователя.
     */
    public static create(userId: UserId): ShoppingList {
        return new ShoppingList(userId);
    }

    /**
     * Восстанавливает агрегат из хранилища.
     */
    public static reconstitute(
        userId: UserId,
        categories: Category[],
        items: ShoppingListItem[]
    ): ShoppingList {
        const shoppingList = new ShoppingList(userId);
        
        // Добавляем категории
        categories.forEach(category => { 
            if (category.getUserId().equals(userId)) {
                shoppingList._categories.set(category.getId().value, category);
            }
        });
        
        // Добавляем элементы
        items.forEach(item => {
            if (item.userId.equals(userId)) {
                shoppingList._items.set(item.id.value, item);
            }
        });
        
        return shoppingList;
    }

    /**
     * Добавляет новую категорию в список.
     */
    public addCategory(name: string): Category {
        // Проверяем, не существует ли уже категория с таким именем
        const existingCategory = this.findCategoryByName(name);
        if (existingCategory) {
            throw new DomainException(`категория "${name}" уже существует`);
        }
        
        // Создаем новую категорию
        const category = Category.create(this._userId, name);
        this._categories.set(category.getId().value, category);
        
        return category;
    }

    /**
     * Переименовывает существующую категорию.
     */
    public renameCategory(categoryId: CategoryId, newName: string): Category {
        const category = this.getCategoryById(categoryId);
        
        // Проверяем, не существует ли уже категория с таким именем
        const existingCategory = this.findCategoryByName(newName);
        if (existingCategory && !existingCategory.getId().equals(categoryId)) {
            throw new DomainException(`категория "${newName}" уже существует`);
        }
        
        category.rename(newName);
        return category;
    }

    /**
     * Удаляет категорию и все ее элементы.
     */
    public removeCategory(categoryId: CategoryId): void {
        const category = this.getCategoryById(categoryId);
        
        // Удаляем все элементы этой категории
        const itemsToRemove: string[] = [];
        this._items.forEach((item, key) => {
            if (item.categoryId.equals(categoryId)) {
                itemsToRemove.push(key);
            }
        });
        
        itemsToRemove.forEach(key => this._items.delete(key));
        
        // Удаляем саму категорию
        this._categories.delete(category.getId().value);
    }

    /**
     * Добавляет новый элемент в список покупок.
     */
    public addItem(categoryId: CategoryId, name: string, quantity: Quantity): ShoppingListItem {
        // Проверяем существование категории
        const category = this.getCategoryById(categoryId);
        
        // Проверяем, не существует ли уже элемент с таким именем в этой категории
        const existingItem = this.findItemByNameAndCategory(name, categoryId);
        if (existingItem) {
            throw new DomainException(`элемент "${name}" уже существует в категории "${category.getName()}"`);
        }
        
        // Создаем новый элемент
        const item = ShoppingListItem.create(
            this._userId, 
            categoryId, 
            name, 
            quantity
        );
        
        this._items.set(item.id.value, item);
        
        return item;
    }

    /**
     * Отмечает элемент как купленный.
     */
    public markItemAsPurchased(itemId: ItemId): ShoppingListItem {
        const item = this.getItemById(itemId);
        item.markAsPurchased();
        return item;
    }

    /**
     * Отмечает элемент как не купленный.
     */
    public markItemAsNotPurchased(itemId: ItemId): ShoppingListItem {
        const item = this.getItemById(itemId);
        item.markAsNotPurchased();
        return item;
    }

    /**
     * Изменяет количество элемента.
     */
    public updateItemQuantity(itemId: ItemId, newQuantity: Quantity): ShoppingListItem {
        const item = this.getItemById(itemId);
        item.updateQuantity(newQuantity);
        return item;
    }

    /**
     * Удаляет элемент из списка покупок.
     */
    public removeItem(itemId: ItemId): void {
        const item = this.getItemById(itemId);
        this._items.delete(item.id.value);
    }

    /**
     * Возвращает категорию по идентификатору.
     */
    public getCategoryById(categoryId: CategoryId): Category {
        const category = this._categories.get(categoryId.value);
        if (!category) {
            throw new DomainException(`категория с ID ${categoryId.value} не найдена`);
        }
        return category;
    }

    /**
     * Возвращает элемент по идентификатору.
     */
    public getItemById(itemId: ItemId): ShoppingListItem {
        const item = this._items.get(itemId.value);
        if (!item) {
            throw new DomainException(`элемент с ID ${itemId.value} не найден`);
        }
        return item;
    }

    /**
     * Возвращает категорию по имени (или null, если не найдена).
     */
    public findCategoryByName(name: string): Category | null {
        const normalizedName = name.trim().toLowerCase();
        for (const category of this._categories.values()) {
            if (category.getName().toLowerCase() === normalizedName) {
                return category;
            }
        }
        return null;
    }

    /**
     * Возвращает элемент по имени и категории (или null, если не найден).
     */
    public findItemByNameAndCategory(name: string, categoryId: CategoryId): ShoppingListItem | null {
        const normalizedName = name.trim().toLowerCase();
        for (const item of this._items.values()) {
            if (item.categoryId.equals(categoryId) && item.name.toLowerCase() === normalizedName) {
                return item;
            }
        }
        return null;
    }

    /**
     * Возвращает все категории пользователя.
     */
    public getAllCategories(): Category[] {
        return Array.from(this._categories.values());
    }

    /**
     * Возвращает все элементы пользователя.
     */
    public getAllItems(): ShoppingListItem[] {
        return Array.from(this._items.values());
    }

    /**
     * Возвращает элементы конкретной категории.
     */
    public getItemsByCategory(categoryId: CategoryId): ShoppingListItem[] {
        return Array.from(this._items.values())
            .filter(item => item.categoryId.equals(categoryId));
    }

    /**
     * Возвращает все купленные элементы.
     */
    public getPurchasedItems(): ShoppingListItem[] {
        return Array.from(this._items.values())
            .filter(item => item.purchased);
    }

    /**
     * Возвращает все некупленные элементы.
     */
    public getUnpurchasedItems(): ShoppingListItem[] {
        return Array.from(this._items.values())
            .filter(item => !item.purchased);
    }

    /**
     * Очищает все купленные элементы из списка.
     */
    public clearPurchasedItems(): void {
        const itemsToRemove: string[] = [];
        this._items.forEach((item, key) => {
            if (item.purchased) {
                itemsToRemove.push(key);
            }
        });
        
        itemsToRemove.forEach(key => this._items.delete(key));
    }

    // Геттеры
    get userId(): UserId { return this._userId; }
    get categoriesCount(): number { return this._categories.size; }
    get itemsCount(): number { return this._items.size; }
} 