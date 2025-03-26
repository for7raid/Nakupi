import { DomainException } from '../exceptions/DomainException';

/**
 * Value Object для имени товара
 */
export class ItemName {
    private readonly _value: string;
    
    /**
     * Максимальная длина имени товара
     */
    private static readonly MAX_LENGTH = 100;
    
    /**
     * Минимальная длина имени товара
     */
    private static readonly MIN_LENGTH = 2;

    /**
     * Создает новый экземпляр ItemName
     * @param value Строковое значение имени
     * @throws DomainException если значение не является валидным именем
     */
    private constructor(value: string) {
        this.validate(value);
        this._value = value;
    }

    /**
     * Валидирует имя товара
     * @param value Строковое значение имени
     * @throws DomainException если значение не является валидным именем
     */
    private validate(value: string): void {
        if (!value || value.trim().length < ItemName.MIN_LENGTH) {
            throw new DomainException(`Название товара должно содержать минимум ${ItemName.MIN_LENGTH} символа`);
        }
        
        if (value.trim().length > ItemName.MAX_LENGTH) {
            throw new DomainException(`Название товара не должно превышать ${ItemName.MAX_LENGTH} символов`);
        }
    }

    /**
     * Фабричный метод для создания экземпляра ItemName
     * @param value Строковое значение имени
     * @returns Новый экземпляр ItemName
     * @throws DomainException если значение не является валидным именем
     */
    public static create(value: string): ItemName {
        return new ItemName(value);
    }

    /**
     * Возвращает строковое представление имени
     */
    public get value(): string {
        return this._value;
    }

    /**
     * Сравнивает текущий ItemName с другим
     * @param other Другой ItemName для сравнения
     * @returns true, если имена равны, иначе false
     */
    public equals(other: ItemName): boolean {
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