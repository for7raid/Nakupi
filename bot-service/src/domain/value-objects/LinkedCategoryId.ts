import { Identifier } from './Identifier';
import { DomainException } from '../exceptions/DomainException';

/**
 * Value Object для идентификатора связанной категории
 */
export class LinkedCategoryId extends Identifier<string> {
    /**
     * Создает новый экземпляр LinkedCategoryId
     * @param value Строковое значение идентификатора
     * @throws DomainException если значение не является валидным идентификатором
     */
    private constructor(value: string) {
        if (!value || value.trim().length === 0) {
            throw new DomainException('LinkedCategoryId не может быть пустым');
        }
        super(value);
    }

    /**
     * Фабричный метод для создания экземпляра LinkedCategoryId
     * @param value Строковое значение идентификатора
     * @returns Новый экземпляр LinkedCategoryId
     * @throws DomainException если значение не является валидным идентификатором
     */
    public static create(value: string): LinkedCategoryId {
        return new LinkedCategoryId(value);
    }
} 