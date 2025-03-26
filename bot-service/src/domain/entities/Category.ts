import { DomainException } from '../exceptions/DomainException';
import { CategoryId } from '../value-objects/CategoryId';
import { UserId } from '../value-objects/UserId';
import { LinkedCategoryId } from '../value-objects/LinkedCategoryId';
import { CategoryName } from '../value-objects/CategoryName';
import { ShareCode } from '../value-objects/ShareCode';
import { v4 as uuidv4 } from 'uuid';

/**
 * Сущность Категория в контексте списка покупок.
 * Представляет собой группу товаров, объединенных общим назначением.
 */
export class Category {
    private readonly _id: CategoryId;
    private readonly _userId: UserId;
    private _name: CategoryName;
    private readonly _createdAt: Date;
    private _updatedAt: Date | null;
    private _shareCode: ShareCode | null;
    private _shareCodeExpiry: Date | null;
    private _linkedCategoryId: LinkedCategoryId | null;

    private constructor(
        id: CategoryId,
        userId: UserId,
        name: CategoryName,
        createdAt: Date,
        updatedAt: Date | null = null,
        shareCode: ShareCode | null = null,
        shareCodeExpiry: Date | null = null,
        linkedCategoryId: LinkedCategoryId | null = null
    ) {
        this._id = id;
        this._userId = userId;
        this._name = name;
        this._createdAt = createdAt;
        this._updatedAt = updatedAt;
        this._shareCode = shareCode;
        this._shareCodeExpiry = shareCodeExpiry;
        this._linkedCategoryId = linkedCategoryId;
    }

    /**
     * Создает новую категорию с заданным именем.
     */
    public static create(userId: UserId, name: string): Category {
        const categoryName = CategoryName.create(name);
        return new Category(
            CategoryId.create(uuidv4()),
            userId,
            categoryName,
            new Date()
        );
    }

    /**
     * Восстанавливает категорию из хранилища.
     */
    public static reconstitute(
        id: CategoryId,
        userId: UserId,
        name: string,
        createdAt: Date,
        updatedAt: Date | null = null,
        shareCode: string | null = null,
        shareCodeExpiry: Date | null = null,
        linkedCategoryId: string | null = null
    ): Category {
        const categoryName = CategoryName.create(name);
        const shareCodeObj = shareCode ? ShareCode.create(shareCode) : null;
        const linkedCategoryIdObj = linkedCategoryId 
            ? LinkedCategoryId.create(linkedCategoryId) 
            : null;
            
        return new Category(
            id,
            userId,
            categoryName,
            createdAt,
            updatedAt,
            shareCodeObj,
            shareCodeExpiry,
            linkedCategoryIdObj
        );
    }

    /**
     * Изменяет название категории.
     */
    public rename(newName: string): void {
        const categoryName = CategoryName.create(newName);
        this._name = categoryName;
        this._updatedAt = new Date();
    }

    /**
     * Проверяет, принадлежит ли категория указанному пользователю.
     */
    public belongsToUser(userId: UserId): boolean {
        return this._userId.equals(userId);
    }

    /**
     * Валидация названия категории.
     */
    private validateName(name: string): void {
        if (!name || name.trim().length < 2) {
            throw new DomainException('название категории должно содержать минимум 2 символа');
        }
        
        if (name.trim().length > 50) {
            throw new DomainException('название категории не должно превышать 50 символов');
        }
    }

    // Геттеры
    public getId(): CategoryId {
        return this._id;
    }

    public getUserId(): UserId {
        return this._userId;
    }

    public getName(): string {
        return this._name.value;
    }
    
    public getCategoryName(): CategoryName {
        return this._name;
    }

    public getCreatedAt(): Date {
        return this._createdAt;
    }

    public getUpdatedAt(): Date | null {
        return this._updatedAt;
    }

    public getShareCode(): string | null {
        return this._shareCode ? this._shareCode.value : null;
    }
    
    public getShareCodeObj(): ShareCode | null {
        return this._shareCode;
    }

    public getShareCodeExpiry(): Date | null {
        return this._shareCodeExpiry;
    }

    public getLinkedCategoryId(): LinkedCategoryId | null {
        return this._linkedCategoryId;
    }

    /**
     * Проверяет равенство с другой категорией.
     */
    public equals(other: Category): boolean {
        if (!(other instanceof Category)) return false;
        return this._id.equals(other._id);
    }

    /**
     * Преобразует категорию в простой объект.
     */
    public toObject() {
        return {
            id: this._id.value,
            name: this._name.value,
            userId: this._userId.value,
            createdAt: this._createdAt,
            updatedAt: this._updatedAt,
            shareCode: this._shareCode ? this._shareCode.value : null,
            shareCodeExpiry: this._shareCodeExpiry,
            linkedCategoryId: this._linkedCategoryId ? this._linkedCategoryId.value : null
        };
    }

    public setShareCode(shareCode: string | null): void {
        this._shareCode = shareCode ? ShareCode.create(shareCode) : null;
        this._updatedAt = new Date();
    }

    public setShareCodeExpiry(expiryDate: Date | null): void {
        this._shareCodeExpiry = expiryDate;
        this._updatedAt = new Date();
    }

    public setLinkedCategoryId(linkedCategoryId: string | null): void {
        this._linkedCategoryId = linkedCategoryId 
            ? LinkedCategoryId.create(linkedCategoryId) 
            : null;
        this._updatedAt = new Date();
    }
} 