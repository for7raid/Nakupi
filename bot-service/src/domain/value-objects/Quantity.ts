import { DomainException } from '../exceptions/DomainException';

/**
 * Объект-значение для представления количества товара.
 * Инкапсулирует правила валидации и преобразования количества.
 */
export class Quantity {
    private readonly _value: number;

    /**
     * @param value Числовое значение количества
     */
    constructor(value: number) {
        this.validateValue(value);
        this._value = value;
    }

    private validateValue(value: number): void {
        if (value <= 0) {
            throw new DomainException('количество должно быть положительным числом');
        }
        
        if (!Number.isFinite(value)) {
            throw new DomainException('количество должно быть конечным числом');
        }
        
        if (value > 10000) {
            throw new DomainException('количество не может превышать 10000');
        }
    }

    /**
     * Создает новый объект Quantity с указанным значением.
     */
    public static create(value: number): Quantity {
        return new Quantity(value);
    }

    /**
     * Создает новый объект Quantity из строкового представления.
     */
    public static fromString(valueStr: string): Quantity {
        
        const trimmedValue = valueStr.trim();
        const value = parseFloat(trimmedValue);
        
        return new Quantity(value);
    }

    /**
     * Возвращает числовое значение количества.
     */
    get value(): number {
        return this._value;
    }


    /**
     * Возвращает строковое представление количества с единицей измерения.
     */
    public toString(): string {
        return `${this._value}`;
    }

    /**
     * Сравнивает количество с другим объектом Quantity.
     */
    public equals(other: Quantity): boolean {
        if (!(other instanceof Quantity)) return false;
        return this._value === other._value;
    }

    /**
     * Создает новый объект Quantity с увеличенным значением.
     */
    public increase(amount: number): Quantity {
        return new Quantity(this._value + amount);
    }

    /**
     * Создает новый объект Quantity с уменьшенным значением.
     */
    public decrease(amount: number): Quantity {
        const newValue = this._value - amount;
        if (newValue <= 0) {
            throw new DomainException('количество после уменьшения должно быть положительным');
        }
        return new Quantity(newValue);
    }
} 