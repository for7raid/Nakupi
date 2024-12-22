import { inject, injectable } from "tsyringe";
import { ICategoriesRepository } from "../../../domain/interfaces/repositories/ICategoriesRepository";
import { Category } from "../../../domain/entities/Category";
import { CategoryId } from "../../../domain/value-objects/CategoryId";
import { UserId } from "../../../domain/value-objects/UserId";
import { DomainError } from "../../../domain/errors/DomainError";
import { ICategoriesService } from "../../../domain/interfaces/services/ICategoriesService";
import { IItemsRepository } from "../../../domain/interfaces/repositories/IItemsRepository";

@injectable()
export class CategoriesService implements ICategoriesService {
    constructor(
        @inject("ICategoriesRepository") private readonly categoriesRepository: ICategoriesRepository,
        @inject("IItemsRepository") private readonly itemsRepository: IItemsRepository
    ) {}

    async getList(userId: string): Promise<Category[]> {
        return await this.categoriesRepository.findByUserId(UserId.from(userId));
    }

    async create(name: string, userId: string): Promise<Category> {
        const category = Category.create(name, UserId.from(userId));
        await this.categoriesRepository.save(category);
        return category;
    }

    async delete(id: string): Promise<void> {
        const categoryId = CategoryId.from(id);
        const category = await this.categoriesRepository.findById(categoryId);
        if (!category) throw new DomainError("Category not found");
        
        // Сначала удаляем все товары в категории
        await this.itemsRepository.deleteByCategoryId(categoryId);
        
        // Затем удаляем саму категорию
        await this.categoriesRepository.delete(categoryId);
    }

    async findById(id: string): Promise<Category | null> {
        return await this.categoriesRepository.findById(CategoryId.from(id));
    }

    async rename(id: string, newName: string): Promise<Category> {
        const categoryId = CategoryId.from(id);
        const category = await this.categoriesRepository.findById(categoryId);
        if (!category) throw new DomainError("Category not found");
        category.rename(newName);
        await this.categoriesRepository.save(category);
        return category;
    }

    async findByUserId(userId: string): Promise<Category[]> {
        return await this.categoriesRepository.findByUserId(UserId.from(userId));
    }
}
