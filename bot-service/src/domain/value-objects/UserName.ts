import { DomainException } from '../exceptions/DomainException';

/**
 * Value Object для имени пользователя
 */
export class UserName {
    private readonly _value: string;
    
    /**
     * Максимальная длина имени пользователя
     */
    private static readonly MAX_LENGTH = 100;
    
    /**
     * Минимальная длина имени пользователя
     */
    private static readonly MIN_LENGTH = 1;

    /**
     * Создает новый экземпляр UserName
     * @param value Строковое значение имени
     * @throws DomainException если значение не является валидным именем
     */
    private constructor(value: string) {
        this.validate(value);
        this._value = value;
    }

    /**
     * Валидирует имя пользователя
     * @param value Строковое значение имени
     * @throws DomainException если значение не является валидным именем
     */
    private validate(value: string): void {
        if (!value || value.trim().length < UserName.MIN_LENGTH) {
            throw new DomainException('Имя пользователя не может быть пустым');
        }
        
        if (value.trim().length > UserName.MAX_LENGTH) {
            throw new DomainException(`Имя пользователя не должно превышать ${UserName.MAX_LENGTH} символов`);
        }
    }

    /**
     * Фабричный метод для создания экземпляра UserName
     * @param value Строковое значение имени
     * @returns Новый экземпляр UserName
     * @throws DomainException если значение не является валидным именем
     */
    public static create(value: string): UserName {
        return new UserName(value);
    }

    /**
     * Возвращает строковое представление имени
     */
    public get value(): string {
        return this._value;
    }

    /**
     * Сравнивает текущий UserName с другим
     * @param other Другой UserName для сравнения
     * @returns true, если имена равны, иначе false
     */
    public equals(other: UserName): boolean {
        if (other === null || other === undefined) {
            return false;
        }
        return this._value === other._value;
    }

    /**
     * Возвращает строковое представление имени
     */
    public toString(): string {
        return this._value;
    }
} 