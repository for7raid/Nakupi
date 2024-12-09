import { DataSource, Repository } from 'typeorm';
import { UserModel } from '../../models/UserModel';
import { IUserRepository } from '../../../../domain/interfaces/repositories/IUserRepository';
import { User } from '../../../../domain/entities/User';
import { UserId } from '../../../../domain/value-objects/UserId';
import { ObjectId } from "mongodb";

export class MongoDBUserRepository implements IUserRepository {
    private repository: Repository<UserModel>;

    constructor(dataSource: DataSource) {
        this.repository = dataSource.getMongoRepository(UserModel);
    }

    async save(user: User): Promise<void> {
        try {
            const model = UserModel.fromDomain(user);
            await this.repository.save(model);
        } catch (error) {
            console.error('Error saving user:', error);
            throw error;
        }
    }

    async findById(id: UserId): Promise<User | null> {
        try {
            const model = await this.repository.findOneBy({ id: new ObjectId(id.toString()) });
            if (!model) return null;
            return model.toDomain();
        } catch (error) {
            console.error('Error finding user by id:', error);
            throw error;
        }
    }

    async findByTelegramId(telegramId: string): Promise<User | null> {
        try {
            const model = await this.repository.findOneBy({ telegramId });
            if (!model) return null;
            return model.toDomain();
        } catch (error) {
            console.error('Error finding user by telegram id:', error);
            throw error;
        }
    }

    async delete(id: UserId): Promise<void> {
        try {
            await this.repository.delete({ id: new ObjectId(id.toString()) });
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }

    async exists(id: UserId): Promise<boolean> {
        try {
            const count = await this.repository.countBy({ id: new ObjectId(id.toString()) });
            return count > 0;
        } catch (error) {
            console.error('Error checking user existence:', error);
            throw error;
        }
    }
}