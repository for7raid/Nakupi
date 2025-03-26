import { DomainException } from '../exceptions/DomainException';
import { UserId } from '../value-objects/UserId';
import { UserName } from '../value-objects/UserName';

/**
 * Сущность Пользователь.
 * Представляет пользователя системы
 */
export class User {
    private _id: UserId;
    private _name: UserName;
    private _createdAt: Date;
    private _updatedAt: Date | null;
    private _lastActivityAt: Date;
    private _isActive: boolean;

    constructor(
        id: UserId,
        name: UserName,
        isActive: boolean = true,
        createdAt?: Date,
        updatedAt?: Date | null,
        lastActivityAt?: Date
    ) {
        this.validateName(name.value);
        this._id = id;
        this._name = name;
        this._isActive = isActive;
        this._createdAt = createdAt || new Date();
        this._updatedAt = updatedAt || null;
        this._lastActivityAt = lastActivityAt || new Date();
    }

    /**
     * Создает нового пользователя.
     */
    public static create(id: UserId, name: string): User {
        const userName = UserName.create(name);
        return new User(id, userName);
    }

    /**
     * Восстанавливает пользователя из хранилища.
     */
    public static reconstitute(
        id: UserId,
        name: string,
        isActive: boolean,
        createdAt: Date,
        updatedAt: Date | null,
        lastActivityAt: Date
    ): User {
        const userName = UserName.create(name);
        return new User(id, userName, isActive, createdAt, updatedAt, lastActivityAt);
    }

    /**
     * Изменяет имя пользователя.
     */
    public rename(newName: string): void {
        this.validateName(newName);
        const userName = UserName.create(newName);
        this._name = userName;
        this._updatedAt = new Date();
    }

    /**
     * Отмечает активность пользователя.
     */
    public markActivity(): void {
        this._lastActivityAt = new Date();
        this._isActive = true;
    }

    /**
     * Деактивирует пользователя.
     */
    public deactivate(): void {
        this._isActive = false;
        this._updatedAt = new Date();
    }

    /**
     * Активирует пользователя.
     */
    public activate(): void {
        this._isActive = true;
        this._updatedAt = new Date();
    }

    /**
     * Валидация имени пользователя.
     */
    private validateName(name: string): void {
        if (!name || name.trim() === '') {
            throw new DomainException('имя пользователя не может быть пустым');
        }
        
        if (name.trim().length > 100) {
            throw new DomainException('имя пользователя не должно превышать 100 символов');
        }
    }

    // Геттеры
    get id(): UserId { return this._id; }
    get name(): string { return this._name.value; }
    get userName(): UserName { return this._name; }
    get isActive(): boolean { return this._isActive; }
    get createdAt(): Date { return this._createdAt; }
    get updatedAt(): Date | null { return this._updatedAt; }
    get lastActivityAt(): Date { return this._lastActivityAt; }

    /**
     * Проверяет, был ли пользователь активен за последние N дней.
     */
    public wasActiveInLastDays(days: number): boolean {
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - this._lastActivityAt.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= days;
    }

    /**
     * Проверяет равенство с другим пользователем.
     */
    public equals(other: User): boolean {
        if (!(other instanceof User)) return false;
        return this._id.equals(other._id);
    }

    /**
     * Преобразует пользователя в простой объект.
     */
    public toObject() {
        return {
            id: this._id.value,
            name: this._name.value,
            isActive: this._isActive,
            createdAt: this._createdAt,
            updatedAt: this._updatedAt,
            lastActivityAt: this._lastActivityAt
        };
    }
} 