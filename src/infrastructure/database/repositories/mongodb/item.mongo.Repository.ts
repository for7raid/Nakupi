import { DataSource, Repository } from 'typeorm';
import { ItemModel } from '../../models/ItemModel';
import { IItemsRepository } from '../../../../domain/interfaces/repositories/IItemsRepository';
import { Item } from '../../../../domain/entities/Item';
import { CategoryId } from '../../../../domain/value-objects/CategoryId';
import { UserId } from '../../../../domain/value-objects/UserId';
import { ObjectId } from "mongodb";

export class MongoDBItemRepository implements IItemsRepository {
    private repository: Repository<ItemModel>;

    constructor(dataSource: DataSource) {
        this.repository = dataSource.getMongoRepository(ItemModel);
    }

    async save(item: Item): Promise<void> {
        try {
            const model = ItemModel.fromDomain(item);
            await this.repository.save(model);
        } catch (error) {
            console.error('Error saving item:', error);
            throw error;
        }
    }

    async findById(id: string): Promise<Item | null> {
        try {
            const objectId = new ObjectId(id);
            const model = await this.repository.findOne({
                where: {
                    _id: objectId
                } as any
            });
            if (!model) return null;
            return model.toDomain();
        } catch (error) {
            console.error('Error finding item:', error);
            throw error;
        }
    }

    async findByCategoryId(categoryId: CategoryId): Promise<Item[]> {
        try {
            const models = await this.repository.find({ where: { categoryId: categoryId.toString() } });
            return models.map(model => model.toDomain());
        } catch (error) {
            console.error('Error finding items by category:', error);
            throw error;
        }
    }

    async findByUserId(userId: UserId): Promise<Item[]> {
        try {
            const models = await this.repository.findBy({ userId: userId.toString() });
            return models.map(model => model.toDomain());
        } catch (error) {
            console.error('Error finding items by user:', error);
            throw error;
        }
    }

    async delete(id: string): Promise<void> {
        try {
            const result = await this.repository.delete({ _id: new ObjectId(id) } as any);
            console.log(`Deleted item with ID ${id}, affected rows: ${result.affected}`);
        } catch (error) {
            console.error('Error deleting item:', error);
            throw error;
        }
    }

    async deleteByCategoryId(categoryId: CategoryId): Promise<void> {
        try {
            const result = await this.repository.delete({ categoryId: categoryId.toString() } as any);
            console.log(`Deleted items from category ${categoryId.toString()}, affected rows: ${result.affected}`);
        } catch (error) {
            console.error('Error deleting items by category:', error);
            throw error;
        }
    }

    async toggleComplete(item: Item): Promise<void> {
        try {
            const updatedItem = item;
            updatedItem.toggleComplete();
            await this.save(updatedItem);
        } catch (error) {
            console.error('Error toggling item complete:', error);
            throw error;
        }
    }

    async exists(id: string): Promise<boolean> {
        try {
            const count = await this.repository.countBy({ id: new ObjectId(id) });
            return count > 0;
        } catch (error) {
            console.error('Error checking item existence:', error);
            throw error;
        }
    }
}
