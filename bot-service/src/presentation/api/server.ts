import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer, Server as HttpServer } from 'http';
import logger from '@infrastructure/logging/Logger';
import metricsService from '@infrastructure/monitoring';
import { DiContainer } from '@application/di/DiContainer';
import { ShoppingListApplicationService } from '@application/services/ShoppingListApplicationService';
import { UserApplicationService } from '@application/services/UserApplicationService';
import { setupRoutes } from './routes';

export class ApiServer {
    private app: Express;
    private server: HttpServer | null = null;
    private port: number;
    private diContainer: DiContainer;
    private shoppingListService: ShoppingListApplicationService;
    private userService: UserApplicationService;

    constructor(port: number) {
        this.app = express();
        this.port = port;
        this.diContainer = DiContainer.getInstance();
        
        // Получаем сервисы приложения (будут проинициализированы позже в методе start)
        this.shoppingListService = null as any;
        this.userService = null as any;

        // Настраиваем middleware
        this.setupMiddleware();
    }

    private setupMiddleware(): void {
        // Парсинг JSON
        this.app.use(express.json());
        
        // CORS
        this.app.use(cors());
        
        // Безопасность
        this.app.use(helmet());
        
        // Логирование запросов
        this.app.use((req: Request, res: Response, next: NextFunction) => {
            logger.info(`${req.method} ${req.path}`);
            const start = Date.now();
            
            res.on('finish', () => {
                const duration = Date.now() - start;
                logger.info(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
            });
            
            next();
        });
    }

    private setupRoutes(): void {
        // Настраиваем все маршруты API через отдельный файл маршрутов
        const apiRouter = setupRoutes(this.shoppingListService, this.userService);
        this.app.use('/api', apiRouter);
    }

    private setupErrorHandling(): void {
        // Обработка 404
        this.app.use((req: Request, res: Response) => {
            res.status(404).json({ error: 'Not Found' });
        });
        
        // Обработка ошибок
        this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
            logger.error('API error:', err);
            metricsService.incrementError();
            
            res.status(500).json({
                error: 'Internal Server Error',
                message: process.env.NODE_ENV === 'production' ? undefined : err.message
            });
        });
    }

    public async start(): Promise<void> {
        try {
            // Инициализируем сервисы приложения
            this.shoppingListService = this.diContainer.get<ShoppingListApplicationService>('shoppingListApplicationService');
            this.userService = this.diContainer.get<UserApplicationService>('userApplicationService');
            
            // Настраиваем маршруты после инициализации сервисов
            this.setupRoutes();
            
            // Настраиваем обработку ошибок после маршрутов
            this.setupErrorHandling();
            
            // Запускаем сервер
            return new Promise((resolve) => {
                this.server = createServer(this.app);
                this.server.listen(this.port, () => {
                    logger.info(`API сервер запущен на порту ${this.port}`);
                    resolve();
                });
            });
        } catch (error) {
            logger.error('Ошибка при запуске API сервера:', error);
            throw error;
        }
    }

    public async stop(): Promise<void> {
        if (this.server) {
            return new Promise((resolve, reject) => {
                this.server!.close((err) => {
                    if (err) {
                        logger.error('Ошибка при остановке API сервера:', err);
                        reject(err);
                    } else {
                        logger.info('API сервер успешно остановлен');
                        this.server = null;
                        resolve();
                    }
                });
            });
        }
        
        return Promise.resolve();
    }
} 