import { Request, Response, NextFunction } from 'express';
import { ShoppingListApplicationService } from '@application/services/ShoppingListApplicationService';

export class ItemController {
    constructor(private readonly shoppingListService: ShoppingListApplicationService) {}

    /**
     * Получение списка элементов
     */
    public async getItems(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.query.userId as string;
            const categoryId = req.query.categoryId as string | undefined;
            if (!userId) {
                res.status(400).json({ error: 'userId is required' });
                return;
            }
            const items = await this.shoppingListService.getItems(userId, categoryId);
            res.status(200).json(items);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Создание нового элемента
     */
    public async createItem(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { userId, categoryId, name, quantity } = req.body;
            if (!userId || !categoryId || !name || quantity === undefined) {
                res.status(400).json({ error: 'userId, categoryId, name, and quantity are required' });
                return;
            }
            const item = await this.shoppingListService.addItem(userId, categoryId, name, quantity);
            res.status(201).json(item);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Обновление статуса покупки элемента
     */
    public async updateItemPurchaseStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { userId, purchased } = req.body;
            if (!userId) {
                res.status(400).json({ error: 'userId is required' });
                return;
            }
            const item = purchased
                ? await this.shoppingListService.markItemAsPurchased(userId, req.params.id)
                : await this.shoppingListService.markItemAsNotPurchased(userId, req.params.id);
            res.status(200).json(item);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Обновление количества элемента
     */
    public async updateItemQuantity(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { userId, quantity } = req.body;
            if (!userId || quantity === undefined) {
                res.status(400).json({ error: 'userId and quantity are required' });
                return;
            }
            const item = await this.shoppingListService.updateItemQuantity(userId, req.params.id, quantity);
            res.status(200).json(item);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Удаление элемента
     */
    public async deleteItem(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.query.userId as string;
            if (!userId) {
                res.status(400).json({ error: 'userId is required' });
                return;
            }
            await this.shoppingListService.removeItem(userId, req.params.id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    /**
     * Очистка всех купленных элементов
     */
    public async clearPurchasedItems(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.query.userId as string;
            if (!userId) {
                res.status(400).json({ error: 'userId is required' });
                return;
            }
            await this.shoppingListService.clearPurchasedItems(userId);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
} 