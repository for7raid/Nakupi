import { Item } from "../../entities/Item";
import { CategoryId } from "../../value-objects/CategoryId";
import { UserId } from "../../value-objects/UserId";

export interface IItemsRepository {
    save(item: Item): Promise<void>;
    findById(id: string): Promise<Item | null>;
    findByCategoryId(categoryId: CategoryId): Promise<Item[]>;
    findByUserId(userId: UserId): Promise<Item[]>;
    delete(id: string): Promise<void>;
    deleteByCategoryId(categoryId: CategoryId): Promise<void>;
    toggleComplete(item: Item): Promise<void>;
    exists(id: string): Promise<boolean>;
}
