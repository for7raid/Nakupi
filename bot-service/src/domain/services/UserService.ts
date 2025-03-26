import { User } from '../entities/User';
import { DomainException } from '../exceptions/DomainException';
import { IUserRepository } from '../repositories/IUserRepository';
import { UserId } from '../value-objects/UserId';

/**
 * Доменный сервис для работы с пользователями.
 */
export class UserService {
    private readonly userRepository: IUserRepository;

    constructor(userRepository: IUserRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Регистрирует пользователя в системе.
     */
    public async registerUser(userId: UserId, name: string): Promise<User> {
        try {
            // Проверяем, существует ли пользователь
            let user = await this.userRepository.findById(userId);
            
            if (!user) {
                // Если пользователя нет, создаем нового
                user = User.create(userId, name);
                await this.userRepository.save(user);
            } else {
                // Если пользователь есть, обновляем имя
                user.rename(name);
                await this.userRepository.save(user);
            }
            
            return user;
        } catch (error) {
            if (error instanceof DomainException) {
                throw error;
            }
            throw new Error(`Ошибка при регистрации пользователя: ${error}`);
        }
    }

    /**
     * Обновляет дату последней активности пользователя.
     */
    public async markUserActivity(userId: UserId): Promise<void> {
        try {
            // Получаем пользователя
            const user = await this.userRepository.findById(userId);
            
            if (!user) {
                throw new DomainException('пользователь не найден');
            }
            
            // Обновляем дату последней активности
            user.markActivity();
            await this.userRepository.save(user);
        } catch (error) {
            if (error instanceof DomainException) {
                throw error;
            }
            throw new Error(`Ошибка при обновлении активности пользователя: ${error}`);
        }
    }
} 