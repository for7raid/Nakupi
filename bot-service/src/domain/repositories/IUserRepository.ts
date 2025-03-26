import { User } from '../entities/User';
import { UserId } from '../value-objects/UserId';

/**
 * Интерфейс репозитория для работы с пользователями.
 * Определяет методы для сохранения и получения пользователей.
 */
export interface IUserRepository {
    /**
     * Сохраняет пользователя в хранилище.
     */
    save(user: User): Promise<void>;
    
    /**
     * Находит пользователя по идентификатору.
     */
    findById(id: UserId): Promise<User | null>;
    
    /**
     * Находит всех пользователей.
     */
    findAll(): Promise<User[]>;
    
    /**
     * Находит активных пользователей.
     */
    findActive(): Promise<User[]>;
}