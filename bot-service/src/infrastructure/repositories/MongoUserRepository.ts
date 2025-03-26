import { Collection, Document, ObjectId } from 'mongodb';
import { User } from '../../domain/entities/User';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { UserId } from '../../domain/value-objects/UserId';
import { MongoConnection } from '../database/MongoConnection';

/**
 * MongoDB-реализация репозитория пользователей.
 */
export class MongoUserRepository implements IUserRepository {
    private static readonly COLLECTION_NAME = 'users';
    private connection: MongoConnection;

    constructor() {
        this.connection = MongoConnection.getInstance();
    }

    /**
     * Получает коллекцию пользователей.
     */
    private async getCollection(): Promise<Collection<Document>> {
        return this.connection.getCollection(MongoUserRepository.COLLECTION_NAME);
    }

    /**
     * Сохраняет пользователя в MongoDB.
     */
    public async save(user: User): Promise<void> {
        const collection = await this.getCollection();
        const userDto = this.mapToDto(user);

        await collection.updateOne(
            { userId: userDto.userId },
            { $set: userDto },
            { upsert: true }
        );
    }

    /**
     * Находит пользователя по идентификатору.
     */
    public async findById(id: UserId): Promise<User | null> {
        const collection = await this.getCollection();
        const userDto = await collection.findOne({ userId: id.value });

        if (!userDto) {
            return null;
        }

        return this.mapToDomain(userDto);
    }

    /**
     * Находит всех пользователей.
     */
    public async findAll(): Promise<User[]> {
        const collection = await this.getCollection();
        const usersDto = await collection.find().toArray();

        return usersDto.map(userDto => this.mapToDomain(userDto));
    }

    /**
     * Находит активных пользователей.
     */
    public async findActive(): Promise<User[]> {
        const collection = await this.getCollection();
        const usersDto = await collection.find({ isActive: true }).toArray();

        return usersDto.map(userDto => this.mapToDomain(userDto));
    }

    /**
     * Преобразует объект пользователя в DTO для хранения.
     */
    private mapToDto(user: User): any {
        return {
            userId: user.id.value,
            name: user.name,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            lastActivityAt: user.lastActivityAt
        };
    }

    /**
     * Преобразует DTO из базы данных в доменный объект.
     */
    private mapToDomain(userDto: any): User {
        return User.reconstitute(
            UserId.create(userDto.userId),
            userDto.name,
            userDto.isActive,
            new Date(userDto.createdAt),
            userDto.updatedAt ? new Date(userDto.updatedAt) : null,
            new Date(userDto.lastActivityAt)
        );
    }
} 