import { IUserRepository } from '../../domain/intefaces/IUserRepository';
import { User } from '../../domain/models/User';
import { Validator } from '../validation/Validator';
import logger from '../../infrastructure/logging/Logger';
import metricsService from '../../infrastructure/monitoring';

/**
 * Сервис для работы с пользователями
 */
export class UserService {
    constructor(private repository: IUserRepository) {}

    /**
     * Сохраняет нового пользователя
     */
    async saveUser(user: User): Promise<void> {
        try {
            if (!Validator.validateUser(user)) {
                const error = new Error('Невалидный пользователь');
                logger.error('Ошибка валидации пользователя', { user });
                throw error;
            }
            
            await this.repository.addUser(user);
            logger.info('Добавлен новый пользователь', { userId: user.id, userName: user.name });
            metricsService.incrementUserCreated();
        } catch (error) {
            logger.error('Ошибка при сохранении пользователя:', error);
            metricsService.incrementError();
            throw error;
        }
    }

    /**
     * Получает пользователя по идентификатору
     */
    async getUser(id: string): Promise<User | null> {
        try {
            if (!id) {
                const error = new Error('Идентификатор пользователя не указан');
                logger.error('Ошибка валидации идентификатора пользователя');
                throw error;
            }
            
            return await this.repository.getUserById(id);
        } catch (error) {
            logger.error('Ошибка при получении пользователя:', error);
            metricsService.incrementError();
            throw error;
        }
    }

    /**
     * Обновляет данные пользователя
     */
    async updateUser(user: User): Promise<User> {
        try {
            if (!Validator.validateUser(user)) {
                const error = new Error('Невалидный пользователь');
                logger.error('Ошибка валидации пользователя', { user });
                throw error;
            }
            
            const updatedUser = await this.repository.updateUser(user);
            logger.info('Обновлен пользователь', { userId: user.id });
            return updatedUser;
        } catch (error) {
            logger.error('Ошибка при обновлении пользователя:', error);
            metricsService.incrementError();
            throw error;
        }
    }
}