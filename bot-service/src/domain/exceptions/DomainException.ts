/**
 * Базовый класс для всех исключений в доменном слое
 */
export class DomainException extends Error {
    /**
     * Создает новый экземпляр доменного исключения
     * @param message Сообщение об ошибке
     */
    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
        // Для правильной работы стека ошибки в наследниках
        Error.captureStackTrace(this, this.constructor);
    }
} 