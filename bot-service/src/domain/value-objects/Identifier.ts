/**
 * Базовый абстрактный класс для идентификаторов в системе
 * @template T Тип идентификатора (обычно string или number)
 */
export abstract class Identifier<T> {
    private readonly _value: T;

    /**
     * Создает новый экземпляр идентификатора
     * @param value Значение идентификатора
     */
    protected constructor(value: T) {
        this._value = value;
    }

    /**
     * Возвращает значение идентификатора
     */
    public get value(): T {
        return this._value;
    }

    /**
     * Сравнивает текущий идентификатор с другим
     * @param other Другой идентификатор для сравнения
     * @returns true, если идентификаторы равны, иначе false
     */
    public equals(other: Identifier<T>): boolean {
        if (other === null || other === undefined) {
            return false;
        }
        if (!(other instanceof this.constructor)) {
            return false;
        }
        return this._value === other._value;
    }

    /**
     * Возвращает строковое представление идентификатора
     */
    public toString(): string {
        return String(this._value);
    }
} 