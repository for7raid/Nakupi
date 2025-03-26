import { Collection, Document, ObjectId } from 'mongodb';
import { Category } from '../../domain/entities/Category';
import { ICategoryRepository } from '../../domain/repositories/ICategoryRepository';
import { CategoryId } from '../../domain/value-objects/CategoryId';
import { UserId } from '../../domain/value-objects/UserId';
import { MongoConnection } from '../database/MongoConnection';

/**
 * MongoDB-реализация репозитория категорий.
 */
export class MongoCategoryRepository implements ICategoryRepository {
    private static readonly COLLECTION_NAME = 'categories';
    private connection: MongoConnection;

    constructor() {
        this.connection = MongoConnection.getInstance();
    }

    /**
     * Получает коллекцию категорий.
     */
    private async getCollection(): Promise<Collection<Document>> {
        return this.connection.getCollection(MongoCategoryRepository.COLLECTION_NAME);
    }

    /**
     * Сохраняет категорию в MongoDB.
     */
    public async save(category: Category): Promise<void> {
        const collection = await this.getCollection();
        const categoryDto = this.mapToDto(category);

        await collection.updateOne(
            { categoryId: categoryDto.categoryId },
            { $set: categoryDto },
            { upsert: true }
        );
    }

    /**
     * Находит категорию по идентификатору.
     */
    public async findById(id: CategoryId): Promise<Category | null> {
        const collection = await this.getCollection();
        const categoryDto = await collection.findOne({ categoryId: id.value });

        if (!categoryDto) {
            return null;
        }

        return this.mapToDomain(categoryDto);
    }

    /**
     * Находит категории по идентификатору пользователя.
     */
    public async findByUserId(userId: UserId): Promise<Category[]> {
        const collection = await this.getCollection();
        const categoriesDto = await collection.find({ userId: userId.value }).toArray();

        return categoriesDto.map(categoryDto => this.mapToDomain(categoryDto));
    }

    /**
     * Находит категорию по идентификатору пользователя и названию.
     */
    public async findByUserIdAndName(userId: UserId, name: string): Promise<Category | null> {
        const collection = await this.getCollection();
        const categoryDto = await collection.findOne({
            userId: userId.value,
            name: name
        });

        if (!categoryDto) {
            return null;
        }

        return this.mapToDomain(categoryDto);
    }

    /**
     * Удаляет категорию по идентификатору.
     */
    public async remove(id: CategoryId): Promise<void> {
        const collection = await this.getCollection();
        await collection.deleteOne({ categoryId: id.value });
    }

    /**
     * Сохраняет код доступа для категории.
     */
    public async saveShareCode(categoryId: CategoryId, shareCode: string, expiryDate: Date): Promise<void> {
        const collection = await this.getCollection();
        await collection.updateOne(
            { categoryId: categoryId.value },
            { 
                $set: { 
                    shareCode,
                    shareCodeExpiry: expiryDate
                }
            }
        );
    }

    /**
     * Получает время истечения кода доступа для категории.
     */
    public async getShareCodeExpiry(categoryId: CategoryId): Promise<Date | null> {
        const collection = await this.getCollection();
        const categoryDto = await collection.findOne(
            { categoryId: categoryId.value },
            { projection: { shareCodeExpiry: 1 } }
        );

        if (!categoryDto?.shareCodeExpiry) {
            return null;
        }

        return new Date(categoryDto.shareCodeExpiry);
    }

    /**
     * Находит категорию по коду доступа.
     */
    public async findByShareCode(shareCode: string): Promise<Category | null> {
        const collection = await this.getCollection();
        const categoryDto = await collection.findOne({ shareCode });
        
        if (!categoryDto) {
            return null;
        }
        
        return this.mapToDomain(categoryDto);
    }

    /**
     * Преобразует объект категории в DTO для хранения.
     */
    private mapToDto(category: Category): any {
        const linkedCategoryId = category.getLinkedCategoryId();
        return {
            categoryId: category.getId().value,
            name: category.getName(),
            userId: category.getUserId().value,
            createdAt: category.getCreatedAt(),
            updatedAt: category.getUpdatedAt(),
            shareCode: category.getShareCode(),
            shareCodeExpiry: category.getShareCodeExpiry(),
            linkedCategoryId: linkedCategoryId ? linkedCategoryId.value : null
        };
    }

    /**
     * Преобразует DTO из базы данных в доменный объект.
     */
    private mapToDomain(categoryDto: any): Category {
        const category = Category.reconstitute(
            CategoryId.create(categoryDto.categoryId),
            UserId.create(categoryDto.userId),
            categoryDto.name,
            new Date(categoryDto.createdAt),
            categoryDto.updatedAt ? new Date(categoryDto.updatedAt) : null,
            categoryDto.shareCode || null,
            categoryDto.shareCodeExpiry ? new Date(categoryDto.shareCodeExpiry) : null,
            categoryDto.linkedCategoryId ? categoryDto.linkedCategoryId : null
        );

        return category;
    }
} 