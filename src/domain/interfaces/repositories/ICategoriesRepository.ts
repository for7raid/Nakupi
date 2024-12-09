import { Category } from "../../entities/Category";
import { CategoryId } from "../../value-objects/CategoryId";
import { UserId } from "../../value-objects/UserId";

export interface ICategoriesRepository {
  save(category: Category): Promise<void>;
  findById(id: CategoryId): Promise<Category | null>;
  findByUserId(userId: UserId): Promise<Category[]>;
  delete(id: CategoryId): Promise<void>;
  exists(id: CategoryId): Promise<boolean>;
}
