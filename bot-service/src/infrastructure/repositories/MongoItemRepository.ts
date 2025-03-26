import { Collection, Document, ObjectId } from 'mongodb';
import { ShoppingListItem } from '../../domain/entities/ShoppingListItem';
import { IItemRepository } from '../../domain/repositories/IItemRepository';
import { CategoryId } from '../../domain/value-objects/CategoryId';
import { ItemId } from '../../domain/value-objects/ItemId';
import { UserId } from '../../domain/value-objects/UserId';
import { Quantity } from '../../domain/value-objects/Quantity';
import { MongoConnection } from '../database/MongoConnection';

/**
 * MongoDB-реализация репозитория элементов списка покупок.
 */
export class MongoItemRepository implements IItemRepository {
    private static readonly COLLECTION_NAME = 'items';
    private connection: MongoConnection;

    constructor() {
        this.connection = MongoConnection.getInstance();
    }

    /**
     * Получает коллекцию элементов.
     */
    private async getCollection(): Promise<Collection<Document>> {
        return this.connection.getCollection(MongoItemRepository.COLLECTION_NAME);
    }

    /**
     * Сохраняет элемент в MongoDB.
     */
    public async save(item: ShoppingListItem): Promise<void> {
        const collection = await this.getCollection();
        const itemDto = this.mapToDto(item);

        await collection.updateOne(
            { itemId: itemDto.itemId },
            { $set: itemDto },
            { upsert: true }
        );
    }

    /**
     * Находит элемент по идентификатору.
     */
    public async findById(id: ItemId): Promise<ShoppingListItem | null> {
        const collection = await this.getCollection();
        const itemDto = await collection.findOne({ itemId: id.value });

        if (!itemDto) {
            return null;
        }

        return this.mapToDomain(itemDto);
    }

    /**
     * Находит элементы по идентификатору пользователя.
     */
    public async findByUserId(userId: UserId): Promise<ShoppingListItem[]> {
        const collection = await this.getCollection();
        const itemsDto = await collection.find({ userId: userId.value }).toArray();

        return itemsDto.map(itemDto => this.mapToDomain(itemDto));
    }

    /**
     * Находит элементы по идентификатору пользователя и категории.
     */
    public async findByUserIdAndCategoryId(userId: UserId, categoryId: CategoryId): Promise<ShoppingListItem[]> {
        const collection = await this.getCollection();
        const itemsDto = await collection.find({
            userId: userId.value,
            categoryId: categoryId.value
        }).toArray();

        return itemsDto.map(itemDto => this.mapToDomain(itemDto));
    }

    /**
     * Находит элементы по идентификатору пользователя и статусу "куплено".
     */
    public async findByUserIdAndPurchasedStatus(userId: UserId, purchased: boolean): Promise<ShoppingListItem[]> {
        const collection = await this.getCollection();
        const itemsDto = await collection.find({
            userId: userId.value,
            purchased: purchased
        }).toArray();

        return itemsDto.map(itemDto => this.mapToDomain(itemDto));
    }

    /**
     * Удаляет элемент по идентификатору.
     */
    public async remove(id: ItemId): Promise<void> {
        const collection = await this.getCollection();
        await collection.deleteOne({ itemId: id.value });
    }

    /**
     * Удаляет все элементы определенной категории.
     */
    public async removeByCategory(categoryId: CategoryId): Promise<void> {
        const collection = await this.getCollection();
        await collection.deleteMany({ categoryId: categoryId.value });
    }

    /**
     * Находит элементы по идентификатору категории.
     */
    public async findByCategory(categoryId: CategoryId): Promise<ShoppingListItem[]> {
        const collection = await this.getCollection();
        const itemsDto = await collection.find({
            categoryId: categoryId.value
        }).toArray();

        return itemsDto.map(itemDto => this.mapToDomain(itemDto));
    }

    /**
     * Находит все элементы в хранилище.
     */
    public async findAll(): Promise<ShoppingListItem[]> {
        const collection = await this.getCollection();
        const itemsDto = await collection.find({}).toArray();

        return itemsDto.map(itemDto => this.mapToDomain(itemDto));
    }

    /**
     * Преобразует объект элемента в DTO для хранения.
     */
    private mapToDto(item: ShoppingListItem): any {
        return {
            itemId: item.id.value,
            name: item.name,
            userId: item.userId.value,
            categoryId: item.categoryId.value,
            quantity: item.quantity.value,
            purchased: item.purchased,
            purchasedDate: item.purchasedAt,
            linkedItemId: item.linkedItemId,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
        };
    }

    /**
     * Преобразует DTO из базы данных в доменный объект.
     */
    private mapToDomain(itemDto: any): ShoppingListItem {
        const quantity = Quantity.create(itemDto.quantity);
        
        const item = ShoppingListItem.reconstitute(
            ItemId.create(itemDto.itemId),
            UserId.create(itemDto.userId),
            CategoryId.create(itemDto.categoryId),
            itemDto.name,
            quantity,
            itemDto.purchased,
            new Date(itemDto.createdAt),
            itemDto.updatedAt ? new Date(itemDto.updatedAt) : null,
            itemDto.purchasedDate ? new Date(itemDto.purchasedDate) : null,
            itemDto.linkedItemId || null
        );
        
        return item;
    }

    async findByCategoryId(categoryId: CategoryId): Promise<ShoppingListItem[]> {
        try {
            const collection = await this.getCollection();
            const itemsDto = await collection.find({ categoryId: categoryId.value }).toArray();
            return itemsDto.map(itemDto => this.mapToDomain(itemDto));
        } catch (error) {
            console.error('Ошибка при поиске элементов по ID категории:', error);
            throw new Error('Ошибка при поиске элементов по ID категории');
        }
    }

    async update(item: ShoppingListItem): Promise<void> {
        try {
            const collection = await this.getCollection();
            const itemDto = this.mapToDto(item);
            await collection.updateOne(
                { itemId: item.id.value },
                { $set: itemDto }
            );
        } catch (error) {
            console.error('Ошибка при обновлении элемента:', error);
            throw new Error('Ошибка при обновлении элемента');
        }
    }

    async add(item: ShoppingListItem): Promise<void> {
        try {
            const collection = await this.getCollection();
            const itemDto = this.mapToDto(item);
            await collection.insertOne(itemDto);
        } catch (error) {
            console.error('Ошибка при добавлении элемента:', error);
            throw new Error('Ошибка при добавлении элемента');
        }
    }
} 