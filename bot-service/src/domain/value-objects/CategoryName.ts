import { DomainException } from '../exceptions/DomainException';

/**
 * Value Object для имени категории
 */
export class CategoryName {
    private readonly _value: string;
    
    /**
     * Максимальная длина имени категории
     */
    private static readonly MAX_LENGTH = 50;
    
    /**
     * Минимальная длина имени категории
     */
    private static readonly MIN_LENGTH = 2;

    /**
     * Создает новый экземпляр CategoryName
     * @param value Строковое значение имени
     * @throws DomainException если значение не является валидным именем
     */
    private constructor(value: string) {
        this.validate(value);
        this._value = value;
    }

    /**
     * Валидирует имя категории
     * @param value Строковое значение имени
     * @throws DomainException если значение не является валидным именем
     */
    private validate(value: string): void {
        if (!value || value.trim().length < CategoryName.MIN_LENGTH) {
            throw new DomainException(`Название категории должно содержать минимум ${CategoryName.MIN_LENGTH} символа`);
        }
        
        if (value.trim().length > CategoryName.MAX_LENGTH) {
            throw new DomainException(`Название категории не должно превышать ${CategoryName.MAX_LENGTH} символов`);
        }
    }

    /**
     * Фабричный метод для создания экземпляра CategoryName
     * @param value Строковое значение имени
     * @returns Новый экземпляр CategoryName
     * @throws DomainException если значение не является валидным именем
     */
    public static create(value: string): CategoryName {
        return new CategoryName(value);
    }

    /**
     * Возвращает строковое представление имени
     */
    public get value(): string {
        return this._value;
    }

    /**
     * Сравнивает текущий CategoryName с другим
     * @param other Другой CategoryName для сравнения
     * @returns true, если имена равны, иначе false
     */
    public equals(other: CategoryName): boolean {
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