import { Category } from "../../entities/Category";

export interface ICategoriesService {
  getList(userId: string): Promise<Category[]>;
  create(name: string, userId: string): Promise<Category>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Category | null>;
  rename(id: string, newName: string): Promise<Category>;
  findByUserId(userId: string): Promise<Category[]>;
}
