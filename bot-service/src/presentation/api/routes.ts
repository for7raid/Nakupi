import { Router } from 'express';
import { CategoryController } from './controllers/CategoryController';
import { ItemController } from './controllers/ItemController';
import { UserController } from './controllers/UserController';
import { AccessController } from './controllers/AccessController';
import { HealthController } from './controllers/HealthController';
import { ShoppingListApplicationService } from '@application/services/ShoppingListApplicationService';
import { UserApplicationService } from '@application/services/UserApplicationService';

export function setupRoutes(
    shoppingListService: ShoppingListApplicationService,
    userService: UserApplicationService
): Router {
    const router = Router();
    
    // Инициализируем контроллеры
    const categoryController = new CategoryController(shoppingListService);
    const itemController = new ItemController(shoppingListService);
    const userController = new UserController(userService);
    const accessController = new AccessController(shoppingListService, userService);
    const healthController = new HealthController();
    
    // Маршруты для мониторинга и диагностики
    router.get('/health', healthController.getStatus.bind(healthController));
    router.get('/status', healthController.getStatus.bind(healthController));
    router.get('/metrics', healthController.getPrometheusMetrics.bind(healthController));
    
    // Маршруты для категорий
    router.get('/categories', categoryController.getCategories.bind(categoryController));
    router.post('/categories', categoryController.createCategory.bind(categoryController));
    router.put('/categories/:id', categoryController.updateCategory.bind(categoryController));
    router.delete('/categories/:id', categoryController.deleteCategory.bind(categoryController));
    
    // Маршруты для совместного доступа (должны быть перед маршрутами категорий с параметрами)
    router.post('/categories/share', accessController.createShareCode.bind(accessController));
    router.post('/categories/join', accessController.joinSharedList.bind(accessController));
    router.get('/categories/:id/access', accessController.getUsersWithAccess.bind(accessController));
    router.delete('/categories/:id/access/:targetUserId', accessController.revokeAccess.bind(accessController));
    router.post('/categories/:id/sync', categoryController.syncSharedList.bind(categoryController));
    
    // Маршруты для элементов списка
    router.get('/items', itemController.getItems.bind(itemController));
    router.post('/items', itemController.createItem.bind(itemController));
    router.put('/items/:id/purchased', itemController.updateItemPurchaseStatus.bind(itemController));
    router.put('/items/:id/quantity', itemController.updateItemQuantity.bind(itemController));
    router.delete('/items/:id', itemController.deleteItem.bind(itemController));
    router.delete('/items', itemController.clearPurchasedItems.bind(itemController));
    
    // Маршруты для пользователей (специфические маршруты должны быть перед общими)
    router.get('/users/active', userController.getActiveUsers.bind(userController));
    router.post('/users', userController.registerUser.bind(userController));
    router.get('/users/:id', userController.getUserById.bind(userController));
    router.put('/users/:id/activity', userController.markUserActivity.bind(userController));
    
    return router;
} 