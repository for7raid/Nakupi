import { Request, Response, NextFunction } from 'express';
import { UserApplicationService } from '@application/services/UserApplicationService';

export class UserController {
    constructor(private readonly userService: UserApplicationService) {}

    /**
     * Получение информации о пользователе по ID
     */
    public async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = await this.userService.getUserById(req.params.id);
            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }
            res.status(200).json(user);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Регистрация нового пользователя
     */
    public async registerUser(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id, name } = req.body;
            if (!id || !name) {
                res.status(400).json({ error: 'id and name are required' });
                return;
            }
            const user = await this.userService.registerUser(id, name);
            res.status(201).json(user);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Отметка активности пользователя
     */
    public async markUserActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await this.userService.markUserActivity(req.params.id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    /**
     * Получение списка активных пользователей
     */
    public async getActiveUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const users = await this.userService.getActiveUsers();
            res.status(200).json(users);
        } catch (error) {
            next(error);
        }
    }
} 