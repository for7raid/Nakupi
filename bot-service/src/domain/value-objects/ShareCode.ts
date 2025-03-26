import { Identifier } from './Identifier';
import { DomainException } from '../exceptions/DomainException';

/**
 * Value Object для кода доступа к списку покупок
 */
export class ShareCode extends Identifier<string> {
    /**
     * Регулярное выражение для проверки валидности кода доступа
     * Код должен содержать только буквы и цифры, длиной от 6 до 10 символов
     */
    private static readonly CODE_PATTERN = /^[A-Za-z0-9]{6,10}$/;

    /**
     * Создает новый экземпляр ShareCode
     * @param value Строковое значение кода доступа
     * @throws DomainException если значение не является валидным кодом
     */
    private constructor(value: string) {
        if (!value || !ShareCode.CODE_PATTERN.test(value)) {
            throw new DomainException('Недействительный код доступа. Код должен содержать от 6 до 10 символов (буквы и цифры)');
        }
        super(value);
    }

    /**
     * Фабричный метод для создания экземпляра ShareCode
     * @param value Строковое значение кода
     * @returns Новый экземпляр ShareCode
     * @throws DomainException если значение не является валидным кодом
     */
    public static create(value: string): ShareCode {
        return new ShareCode(value);
    }

    /**
     * Генерирует случайный код доступа
     * @returns Новый экземпляр ShareCode со случайным значением
     */
    public static generate(): ShareCode {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const length = Math.floor(Math.random() * 5) + 6; // длина от 6 до 10 символов
        
        let code = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            code += characters.charAt(randomIndex);
        }
        
        return new ShareCode(code);
    }
} 