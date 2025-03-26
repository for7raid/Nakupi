import { DomainException } from '@domain/exceptions/DomainException';
import { IUserRepository } from '@domain/repositories/IUserRepository';
import { UserId } from '@domain/value-objects/UserId';
import { User } from '@domain/entities/User';
import { UserDto } from '../dto/UserDto';

/**
 * Сервис приложения для работы с пользователями.
 * Координирует взаимодействие между API/Telegram-ботом и доменными сервисами.
 */
export class UserApplicationService {
    constructor(private readonly userRepository: IUserRepository) {}

    /**
     * Регистрирует нового пользователя в системе или обновляет существующего.
     */
    public async registerUser(userId: string, name: string): Promise<UserDto> {
        try {
            const userIdObj = UserId.create(userId);
            let user = await this.userRepository.findById(userIdObj);

            if (user) {
                // Если пользователь уже существует, обновляем информацию
                user.rename(name);
                user.markActivity();
            } else {
                // Создаем нового пользователя
                user = User.create(userIdObj, name);
            }

            await this.userRepository.save(user);
            return this.mapToDto(user);
        } catch (error) {
            if (error instanceof DomainException) {
                throw error;
            }
            throw new Error(`Ошибка при регистрации пользователя: ${error}`);
        }
    }

    /**
     * Получает пользователя по идентификатору.
     */
    public async getUserById(userId: string): Promise<UserDto | null> {
        try {
            const userIdObj = UserId.create(userId);
            const user = await this.userRepository.findById(userIdObj);

            if (!user) {
                return null;
            }

            return this.mapToDto(user);
        } catch (error) {
            if (error instanceof DomainException) {
                throw error;
            }
            throw new Error(`Ошибка при получении пользователя: ${error}`);
        }
    }

    /**
     * Отмечает активность пользователя.
     */
    public async markUserActivity(userId: string): Promise<void> {
        try {
            const userIdObj = UserId.create(userId);
            const user = await this.userRepository.findById(userIdObj);

            if (!user) {
                throw new DomainException(`пользователь с ID ${userId} не найден`);
            }

            user.markActivity();
            await this.userRepository.save(user);
        } catch (error) {
            if (error instanceof DomainException) {
                throw error;
            }
            throw new Error(`Ошибка при отметке активности пользователя: ${error}`);
        }
    }

    /**
     * Получает всех активных пользователей.
     */
    public async getActiveUsers(): Promise<UserDto[]> {
        try {
            const users = await this.userRepository.findActive();
            return users.map(user => this.mapToDto(user));
        } catch (error) {
            if (error instanceof DomainException) {
                throw error;
            }
            throw new Error(`Ошибка при получении активных пользователей: ${error}`);
        }
    }

    /**
     * Преобразует доменный объект пользователя в DTO.
     */
    private mapToDto(user: User): UserDto {
        return {
            id: user.id.value,
            name: user.name,
            isActive: user.isActive,
            lastActivityAt: user.lastActivityAt,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };
    }
} 