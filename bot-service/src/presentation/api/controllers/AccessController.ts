import { Request, Response, NextFunction } from 'express';
import { ShoppingListApplicationService } from '@application/services/ShoppingListApplicationService';
import { UserApplicationService } from '@application/services/UserApplicationService';

export class AccessController {
    constructor(
        private readonly shoppingListService: ShoppingListApplicationService,
        private readonly userService: UserApplicationService
    ) {}

    /**
     * Создание кода доступа к списку
     */
    public async createShareCode(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { userId, categoryId } = req.body;
            if (!userId || !categoryId) {
                res.status(400).json({ error: 'userId and categoryId are required' });
                return;
            }
            
            // Генерируем код доступа (8 символов, буквы и цифры)
            const shareCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            
            await this.shoppingListService.createShareCode(userId, categoryId, shareCode);
            
            res.status(200).json({
                code: shareCode,
                categoryId,
                userId,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Неделя
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Присоединение к списку по коду доступа
     */
    public async joinSharedList(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { userId, shareCode } = req.body;
            if (!userId || !shareCode) {
                res.status(400).json({ error: 'userId and shareCode are required' });
                return;
            }
            
            const category = await this.shoppingListService.joinSharedList(userId, shareCode);
            res.status(200).json(category);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Получение списка пользователей с доступом к категории
     */
    public async getUsersWithAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.query.userId as string;
            const categoryId = req.params.id;
            
            if (!userId || !categoryId) {
                res.status(400).json({ error: 'userId and categoryId are required' });
                return;
            }
            
            const users = await this.shoppingListService.getUsersWithAccess(userId, categoryId);
            
            // Получаем информацию о пользователях для отображения имен
            const usersWithDetails = await Promise.all(users.map(async (user) => {
                const userDetails = await this.userService.getUserById(user.id);
                return {
                    userId: user.id,
                    categoryId,
                    username: userDetails?.name || user.id,
                    isOwner: user.isOwner
                };
            }));
            
            res.status(200).json(usersWithDetails);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Отзыв доступа к списку
     */
    public async revokeAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.query.userId as string;
            const categoryId = req.params.id;
            const targetUserId = req.params.targetUserId;
            
            if (!userId || !categoryId || !targetUserId) {
                res.status(400).json({ error: 'userId, categoryId and targetUserId are required' });
                return;
            }
            
            await this.shoppingListService.revokeListAccess(userId, categoryId, targetUserId);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
} 