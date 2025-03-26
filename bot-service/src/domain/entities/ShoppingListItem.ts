import { DomainException } from '../exceptions/DomainException';
import { CategoryId } from '../value-objects/CategoryId';
import { UserId } from '../value-objects/UserId';
import { ItemId } from '../value-objects/ItemId';
import { Quantity } from '../value-objects/Quantity';
import { ItemName } from '../value-objects/ItemName';
import { v4 as uuidv4 } from 'uuid';

/**
 * Сущность Элемент списка покупок.
 * Представляет товар, который нужно купить.
 */
export class ShoppingListItem {
    private readonly _id: ItemId;
    private readonly _userId: UserId;
    private readonly _categoryId: CategoryId;
    private _name: ItemName;
    private _quantity: Quantity;
    private _purchased: boolean;
    private readonly _createdAt: Date;
    private _updatedAt: Date | null;
    private _purchasedAt: Date | null;
    private _linkedItemId: string | null;

    private constructor(
        id: ItemId,
        userId: UserId,
        categoryId: CategoryId,
        name: ItemName,
        quantity: Quantity,
        purchased: boolean = false,
        createdAt?: Date,
        updatedAt?: Date | null,
        purchasedAt?: Date | null,
        linkedItemId?: string | null
    ) {
        this._id = id;
        this._userId = userId;
        this._categoryId = categoryId;
        this._name = name;
        this._quantity = quantity;
        this._purchased = purchased;
        this._createdAt = createdAt || new Date();
        this._updatedAt = updatedAt || null;
        this._purchasedAt = purchasedAt || null;
        this._linkedItemId = linkedItemId || null;
    }

    /**
     * Создает новый элемент.
     */
    public static create(
        userId: UserId,
        categoryId: CategoryId,
        name: string,
        quantity: Quantity
    ): ShoppingListItem {
        const itemName = ItemName.create(name);
        return new ShoppingListItem(
            ItemId.create(uuidv4()),
            userId,
            categoryId,
            itemName,
            quantity
        );
    }

    /**
     * Восстанавливает элемент из хранилища.
     */
    public static reconstitute(
        id: ItemId,
        userId: UserId,
        categoryId: CategoryId,
        name: string,
        quantity: Quantity,
        purchased: boolean,
        createdAt: Date,
        updatedAt: Date | null,
        purchasedAt: Date | null,
        linkedItemId: string | null
    ): ShoppingListItem {
        const itemName = ItemName.create(name);
        return new ShoppingListItem(
            id,
            userId,
            categoryId,
            itemName,
            quantity,
            purchased,
            createdAt,
            updatedAt,
            purchasedAt,
            linkedItemId
        );
    }

    /**
     * Отмечает элемент как купленный.
     */
    public markAsPurchased(): void {
        this._purchased = true;
        this._purchasedAt = new Date();
        this._updatedAt = new Date();
    }

    /**
     * Отмечает элемент как не купленный.
     */
    public markAsNotPurchased(): void {
        this._purchased = false;
        this._purchasedAt = null;
        this._updatedAt = new Date();
    }

    /**
     * Изменяет название товара.
     */
    public rename(newName: string): void {
        const itemName = ItemName.create(newName);
        this._name = itemName;
        this._updatedAt = new Date();
    }

    /**
     * Изменяет количество товара.
     */
    public updateQuantity(newQuantity: Quantity): void {
        this._quantity = newQuantity;
        this._updatedAt = new Date();
    }

    /**
     * Устанавливает связь с другим элементом (для общих списков).
     */
    public setLinkedItemId(linkedItemId: string | null): void {
        this._linkedItemId = linkedItemId;
        this._updatedAt = new Date();
    }

    // Геттеры
    public get id(): ItemId { return this._id; }
    public get userId(): UserId { return this._userId; }
    public get categoryId(): CategoryId { return this._categoryId; }
    public get name(): string { return this._name.value; }
    public get itemName(): ItemName { return this._name; }
    public get quantity(): Quantity { return this._quantity; }
    public get purchased(): boolean { return this._purchased; }
    public get createdAt(): Date { return this._createdAt; }
    public get updatedAt(): Date | null { return this._updatedAt; }
    public get purchasedAt(): Date | null { return this._purchasedAt; }
    public get linkedItemId(): string | null { return this._linkedItemId; }

    /**
     * Проверяет, принадлежит ли элемент указанной категории.
     */
    public belongsToCategory(categoryId: CategoryId): boolean {
        return this._categoryId.equals(categoryId);
    }

    /**
     * Преобразует элемент в простой объект.
     */
    public toObject() {
        return {
            id: this._id.value,
            userId: this._userId.value,
            categoryId: this._categoryId.value,
            name: this._name.value,
            quantity: this._quantity.value,
            purchased: this._purchased,
            createdAt: this._createdAt,
            updatedAt: this._updatedAt,
            purchasedAt: this._purchasedAt,
            linkedItemId: this._linkedItemId
        };
    }
} 