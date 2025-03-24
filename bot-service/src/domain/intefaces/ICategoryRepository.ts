import { Category } from '../models/Category';

export interface ICategoryRepository {
    addCategory(category: Category): Promise<Category>;
    getCategories(userId: string): Promise<Category[]>;
    removeCategory(id: string): Promise<void>;
} 