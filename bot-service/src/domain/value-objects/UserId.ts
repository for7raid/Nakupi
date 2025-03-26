import { Identifier } from './Identifier';
import { DomainException } from '../exceptions/DomainException';

/**
 * Value Object для идентификатора пользователя
 */
export class UserId extends Identifier<string> {
    /**
     * Создает новый экземпляр UserId
     * @param value Строковое значение идентификатора
     * @throws DomainException если значение не является валидным идентификатором
     */
    private constructor(value: string) {
        if (!value || value.trim().length === 0) {
            throw new DomainException('UserId не может быть пустым');
        }
        super(value);
    }

    /**
     * Фабричный метод для создания экземпляра UserId
     * @param value Строковое значение идентификатора
     * @returns Новый экземпляр UserId
     * @throws DomainException если значение не является валидным идентификатором
     */
    public static create(value: string): UserId {
        return new UserId(value);
    }
} 