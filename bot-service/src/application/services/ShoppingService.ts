import { ICategoryRepository } from '../../domain/intefaces/ICategoryRepository';
import { IItemRepository } from '../../domain/intefaces/IItemRepository';
import { IUserRepository } from '../../domain/intefaces/IUserRepository';
import { ShoppingListItem } from '../../domain/models/ShoppingListItem';
import { Category } from '../../domain/models/Category';
import { User } from '../../domain/models/User';
import { CategoryService } from './CategoryService';
import { ItemService } from './ItemService';
import { UserService } from './UserService';
import logger from '../../infrastructure/logging/Logger';

/**
 * Фасад для доступа ко всем сервисам, связанным со списком покупок
 */
export class ShoppingService {
    private categoryService: CategoryService;
    private itemService: ItemService;
    private userService: UserService;

    constructor(
        categoryRepository: ICategoryRepository,
        itemRepository: IItemRepository,
        userRepository: IUserRepository
    ) {
        this.categoryService = new CategoryService(categoryRepository, itemRepository);
        this.itemService = new ItemService(itemRepository);
        this.userService = new UserService(userRepository);
        
        logger.info('Инициализирован ShoppingService');
    }

    // Методы для работы с элементами списка покупок
    public async addItem(item: ShoppingListItem): Promise<ShoppingListItem> {
        return this.itemService.addItem(item);
    }

    public async removeItem(id: string): Promise<void> {
        return this.itemService.removeItem(id);
    }

    public async getItems(userId: string, categoryId?: string): Promise<ShoppingListItem[]> {
        return this.itemService.getItems(userId, categoryId);
    }

    public async markAsPurchased(id: string): Promise<void> {
        return this.itemService.markAsPurchased(id);
    }

    public async markAsNotPurchased(id: string): Promise<void> {
        return this.itemService.markAsNotPurchased(id);
    }

    public async updateItemQuantity(id: string, quantity: number): Promise<void> {
        return this.itemService.updateItemQuantity(id, quantity);
    }

    // Методы для работы с категориями
    public async addCategory(category: Category): Promise<Category> {
        return this.categoryService.addCategory(category);
    }

    public async getCategories(userId: string): Promise<Category[]> {
        return this.categoryService.getCategories(userId);
    }

    public async removeCategory(id: string): Promise<void> {
        return this.categoryService.removeCategory(id);
    }

    // Методы для работы с пользователями
    public async saveUser(user: User): Promise<User> {
        const existingUser = await this.userService.getUser(user.id);
        
        if (existingUser) {
            return this.userService.updateUser(user);
        } else {
            await this.userService.saveUser(user);
            return user;
        }
    }

    public async getUser(userId: string): Promise<User | null> {
        return this.userService.getUser(userId);
    }
}