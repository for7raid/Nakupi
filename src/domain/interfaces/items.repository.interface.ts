import { EntityManager } from "typeorm";
import { Item } from "../entities/Item";

export interface IItemsRepository {
    create(data: Partial<Item>, entityManager: EntityManager): Promise<Item>;
    findById(id: string, entityManager: EntityManager): Promise<Item | null>;
    getList(categoryId: string, entityManager: EntityManager): Promise<Item[]>;
    update(item: Item, entityManager: EntityManager): Promise<Item | null>;
    delete(id: string, entityManager: EntityManager): Promise<boolean>;
    deleteByCategoryId(categoryId: string, entityManager: EntityManager): Promise<boolean>;
}
