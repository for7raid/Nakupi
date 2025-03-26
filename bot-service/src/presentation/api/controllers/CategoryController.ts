import { Request, Response, NextFunction } from 'express';
import { ShoppingListApplicationService } from '@application/services/ShoppingListApplicationService';

export class CategoryController {
    constructor(private readonly shoppingListService: ShoppingListApplicationService) {}

    /**
     * Получение списка категорий пользователя
     */
    public async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.query.userId as string;
            if (!userId) {
                res.status(400).json({ error: 'userId is required' });
                return;
            }
            const categories = await this.shoppingListService.getCategories(userId);
            res.status(200).json(categories);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Создание новой категории
     */
    public async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { userId, name } = req.body;
            if (!userId || !name) {
                res.status(400).json({ error: 'userId and name are required' });
                return;
            }
            const category = await this.shoppingListService.addCategory(userId, name);
            res.status(201).json(category);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Обновление существующей категории
     */
    public async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { userId, name } = req.body;
            const categoryId = req.params.id;
            if (!userId || !name) {
                res.status(400).json({ error: 'userId and name are required' });
                return;
            }
            const category = await this.shoppingListService.renameCategory(userId, categoryId, name);
            res.status(200).json(category);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Удаление категории
     */
    public async deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.query.userId as string;
            if (!userId) {
                res.status(400).json({ error: 'userId is required' });
                return;
            }
            await this.shoppingListService.removeCategory(userId, req.params.id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    /**
     * Синхронизация списка покупок для общей категории
     */
    public async syncSharedList(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const categoryId = req.params.id;
            const { userId } = req.body;
            
            if (!userId) {
                res.status(400).json({ error: 'userId is required' });
                return;
            }

            await this.shoppingListService.syncSharedListItems(userId, categoryId);
            res.status(200).json({ message: 'Список успешно синхронизирован' });
        } catch (error) {
            next(error);
        }
    }
} 