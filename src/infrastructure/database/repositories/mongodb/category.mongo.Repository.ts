import { injectable, inject } from "tsyringe";
import { MongoRepository, DataSource } from "typeorm";
import { Category } from "../../../../domain/entities/Category";
import { ICategoriesRepository } from "../../../../domain/interfaces/repositories/ICategoriesRepository";
import { CategoryId } from "../../../../domain/value-objects/CategoryId";
import { UserId } from "../../../../domain/value-objects/UserId";
import { CategoryModel } from "../../models/CategoryModel";
import { ObjectId } from "mongodb";

@injectable()
export class MongoDBCategoryRepository implements ICategoriesRepository {
    private readonly repository: MongoRepository<CategoryModel>;

    constructor(dataSource: DataSource) {
        this.repository = dataSource.getMongoRepository(CategoryModel);
    }

    async save(category: Category): Promise<void> {
        try {
            if (!this.repository) {
                console.error('Repository is undefined in save');
                throw new Error('Repository is undefined');
            }

            console.log(`Saving category: ${category.name}`);
            
            const model = CategoryModel.fromDomain(category);
            await this.repository.save(model);

            console.log(`Category saved successfully`);
        } catch (error) {
            console.error('Error in save:', error);
            throw error;
        }
    }

    async findById(id: CategoryId): Promise<Category | null> {
        try {
            if (!this.repository) {
                console.error('Repository is undefined in findById');
                throw new Error('Repository is undefined');
            }

            console.log(`Finding category by id: ${id.toString()}`);
            
            const model = await this.repository.findOneBy({ _id: new ObjectId(id.toString()) });
            if (!model) return null;

            console.log(`Category found successfully`);
            return model.toDomain();
        } catch (error) {
            console.error('Error in findById:', error);
            throw error;
        }
    }

    async findByUserId(userId: UserId): Promise<Category[]> {
        try {
            if (!this.repository) {
                console.error('Repository is undefined in findByUserId');
                throw new Error('Repository is undefined');
            }

            console.log(`Finding categories for userId: ${userId.toString()}`);

            const models = await this.repository.find({
                where: { userId: userId.toString() }
            });

            console.log(`Found ${models.length} categories`);
            return models.map(model => model.toDomain());
        } catch (error) {
            console.error('Error in findByUserId:', error);
            throw error;
        }
    }

    async delete(id: CategoryId): Promise<void> {
        try {
            if (!this.repository) {
                console.error('Repository is undefined in delete');
                throw new Error('Repository is undefined');
            }

            console.log(`Deleting category by id: ${id.toString()}`);
            
            const result = await this.repository.delete({ _id: new ObjectId(id.toString()) } as any);
            console.log(`Category deleted successfully, affected rows: ${result.affected}`);
        } catch (error) {
            console.error('Error in delete:', error);
            throw error;
        }
    }

    async exists(id: CategoryId): Promise<boolean> {
        try {
            if (!this.repository) {
                console.error('Repository is undefined in exists');
                throw new Error('Repository is undefined');
            }

            console.log(`Checking if category exists by id: ${id.toString()}`);
            
            const count = await this.repository.countBy({ _id: new ObjectId(id.toString()) });

            console.log(`Category exists: ${count > 0}`);
            return count > 0;
        } catch (error) {
            console.error('Error in exists:', error);
            throw error;
        }
    }
}
