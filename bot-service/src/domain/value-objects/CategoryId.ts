import { Identifier } from './Identifier';
import { DomainException } from '../exceptions/DomainException';

/**
 * Value Object для идентификатора категории
 */
export class CategoryId extends Identifier<string> {
    /**
     * Создает новый экземпляр CategoryId
     * @param value Строковое значение идентификатора
     * @throws DomainException если значение не является валидным идентификатором
     */
    private constructor(value: string) {
        if (!value || value.trim().length === 0) {
            throw new DomainException('CategoryId не может быть пустым');
        }
        super(value);
    }

    /**
     * Фабричный метод для создания экземпляра CategoryId
     * @param value Строковое значение идентификатора
     * @returns Новый экземпляр CategoryId
     * @throws DomainException если значение не является валидным идентификатором
     */
    public static create(value: string): CategoryId {
        return new CategoryId(value);
    }
} 