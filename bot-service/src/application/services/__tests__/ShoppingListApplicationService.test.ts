import { ShoppingListApplicationService } from '../ShoppingListApplicationService';
import { ShoppingListService } from '../../../domain/services/ShoppingListService';
import { Category } from '../../../domain/entities/Category';
import { ShoppingListItem } from '../../../domain/entities/ShoppingListItem';
import { UserId } from '../../../domain/value-objects/UserId';
import { CategoryId } from '../../../domain/value-objects/CategoryId';
import { ItemId } from '../../../domain/value-objects/ItemId';
import { Quantity } from '../../../domain/value-objects/Quantity';
import { DomainException } from '../../../domain/exceptions/DomainException';

describe('ShoppingListApplicationService', () => {
    let shoppingListApplicationService: ShoppingListApplicationService;
    let mockShoppingListService: jest.Mocked<ShoppingListService>;

    beforeEach(() => {
        mockShoppingListService = {
            addCategory: jest.fn(),
            renameCategory: jest.fn(),
            removeCategory: jest.fn(),
            getCategories: jest.fn(),
            addItem: jest.fn(),
            markItemAsPurchased: jest.fn(),
            markItemAsNotPurchased: jest.fn(),
            updateItemQuantity: jest.fn(),
            removeItem: jest.fn(),
            clearPurchasedItems: jest.fn(),
            getItems: jest.fn(),
            getOrCreateShoppingList: jest.fn()
        } as unknown as jest.Mocked<ShoppingListService>;

        shoppingListApplicationService = new ShoppingListApplicationService(mockShoppingListService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('addCategory', () => {
        it('должен успешно добавить категорию', async () => {
            // Создаем тестовые данные
            const userId = 'test-user-id';
            const categoryName = 'Тестовая категория';
            
            // Создаем тестовый объект категории (UserId, name)
            const categoryId = CategoryId.fromString('test-category-id');
            const userIdObj = UserId.fromString(userId);
            const category = Category.create(userIdObj, categoryName);
            
            // Ручное присвоение ID для тестов
            (category as any)._id = categoryId;
            
            // Настраиваем мок
            mockShoppingListService.addCategory.mockResolvedValue(category);
            
            // Вызываем тестируемый метод
            const result = await shoppingListApplicationService.addCategory(userId, categoryName);
            
            // Проверяем вызов метода доменного сервиса
            expect(mockShoppingListService.addCategory).toHaveBeenCalledWith(userId, categoryName);
            
            // Проверяем результат
            expect(result).toEqual(expect.objectContaining({
                id: categoryId.value,
                name: categoryName,
                userId: userId
            }));
        });

        it('должен пробросить ошибку домена', async () => {
            // Настраиваем мок
            mockShoppingListService.addCategory.mockImplementation(() => {
                throw new DomainException('Ошибка домена при добавлении категории');
            });
            
            // Вызываем тестируемый метод и проверяем исключение
            await expect(shoppingListApplicationService.addCategory('test-user-id', 'Тестовая категория'))
                .rejects.toThrow(DomainException);
        });

        it('должен выбросить общую ошибку', async () => {
            // Настраиваем мок
            mockShoppingListService.addCategory.mockImplementation(() => {
                throw new Error('Общая ошибка');
            });
            
            // Вызываем тестируемый метод и проверяем исключение
            await expect(shoppingListApplicationService.addCategory('test-user-id', 'Тестовая категория'))
                .rejects.toThrow('Ошибка при добавлении категории: Error: Общая ошибка');
        });
    });

    describe('renameCategory', () => {
        it('должен успешно переименовать категорию', async () => {
            // Создаем тестовые данные
            const userId = 'test-user-id';
            const categoryId = 'test-category-id';
            const newName = 'Новое имя категории';
            
            // Создаем тестовый объект категории
            const categoryIdObj = CategoryId.fromString(categoryId);
            const userIdObj = UserId.fromString(userId);
            const category = Category.create(userIdObj, 'Старое имя');
            
            // Устанавливаем новое имя и ID вручную
            category.rename(newName);
            (category as any)._id = categoryIdObj;
            
            // Настраиваем мок
            mockShoppingListService.renameCategory.mockResolvedValue(category);
            
            // Вызываем тестируемый метод
            const result = await shoppingListApplicationService.renameCategory(userId, categoryId, newName);
            
            // Проверяем вызов метода доменного сервиса
            expect(mockShoppingListService.renameCategory).toHaveBeenCalledWith(userId, categoryId, newName);
            
            // Проверяем результат
            expect(result).toEqual(expect.objectContaining({
                id: categoryId,
                name: newName,
                userId: userId
            }));
        });
    });

    describe('removeCategory', () => {
        it('должен успешно удалить категорию', async () => {
            // Создаем тестовые данные
            const userId = 'test-user-id';
            const categoryId = 'test-category-id';
            
            // Настраиваем мок
            mockShoppingListService.removeCategory.mockResolvedValue();
            
            // Вызываем тестируемый метод
            await shoppingListApplicationService.removeCategory(userId, categoryId);
            
            // Проверяем вызов метода доменного сервиса
            expect(mockShoppingListService.removeCategory).toHaveBeenCalledWith(userId, categoryId);
        });
    });

    describe('addItem', () => {
        it('должен успешно добавить элемент в список покупок', async () => {
            // Создаем тестовые данные
            const userId = 'test-user-id';
            const categoryId = 'test-category-id';
            const itemName = 'Тестовый товар';
            const quantity = 2;
            
            // Создаем тестовый объект элемента с правильной сигнатурой
            const itemId = ItemId.fromString('test-item-id');
            const userIdObj = UserId.fromString(userId);
            const categoryIdObj = CategoryId.fromString(categoryId);
            const quantityObj = Quantity.create(quantity);
            
            // Создаем item с правильной сигнатурой
            const item = ShoppingListItem.create(
                userIdObj, 
                categoryIdObj, 
                itemName, 
                quantityObj
            );
            
            // Устанавливаем ID вручную
            (item as any)._id = itemId;
            
            // Настраиваем мок
            mockShoppingListService.addItem.mockResolvedValue(item);
            
            // Вызываем тестируемый метод
            const result = await shoppingListApplicationService.addItem(userId, categoryId, itemName, quantity);
            
            // Проверяем вызов метода доменного сервиса
            expect(mockShoppingListService.addItem).toHaveBeenCalledWith(userId, categoryId, itemName, quantity);
            
            // Проверяем результат
            expect(result).toEqual(expect.objectContaining({
                id: itemId.value,
                name: itemName,
                userId: userId,
                categoryId: categoryId,
                quantity: quantity
            }));
        });
    });

    describe('markItemAsPurchased', () => {
        it('должен успешно отметить элемент как купленный', async () => {
            // Создаем тестовые данные
            const userId = 'test-user-id';
            const itemId = 'test-item-id';
            
            // Создаем тестовый объект элемента
            const itemIdObj = ItemId.fromString(itemId);
            const userIdObj = UserId.fromString(userId);
            const categoryIdObj = CategoryId.fromString('test-category-id');
            const quantityObj = Quantity.create(1);
            
            // Создаем элемент с правильной сигнатурой
            const item = ShoppingListItem.create(
                userIdObj, 
                categoryIdObj, 
                'Тестовый товар', 
                quantityObj
            );
            
            // Отмечаем как купленный и устанавливаем ID
            item.markAsPurchased();
            (item as any)._id = itemIdObj;
            
            // Настраиваем мок
            mockShoppingListService.markItemAsPurchased.mockResolvedValue(item);
            
            // Вызываем тестируемый метод
            const result = await shoppingListApplicationService.markItemAsPurchased(userId, itemId);
            
            // Проверяем вызов метода доменного сервиса
            expect(mockShoppingListService.markItemAsPurchased).toHaveBeenCalledWith(userId, itemId);
            
            // Проверяем результат
            expect(result).toEqual(expect.objectContaining({
                id: itemId,
                purchased: true,
                purchasedDate: expect.any(Date)
            }));
        });
    });

    describe('markItemAsNotPurchased', () => {
        it('должен успешно отметить элемент как не купленный', async () => {
            // Создаем тестовые данные
            const userId = 'test-user-id';
            const itemId = 'test-item-id';
            
            // Создаем тестовый объект элемента
            const itemIdObj = ItemId.fromString(itemId);
            const userIdObj = UserId.fromString(userId);
            const categoryIdObj = CategoryId.fromString('test-category-id');
            const quantityObj = Quantity.create(1);
            
            // Создаем элемент с правильной сигнатурой
            const item = ShoppingListItem.create(
                userIdObj, 
                categoryIdObj, 
                'Тестовый товар', 
                quantityObj
            );
            
            // Устанавливаем ID вручную
            (item as any)._id = itemIdObj;
            
            // Настраиваем мок
            mockShoppingListService.markItemAsNotPurchased.mockResolvedValue(item);
            
            // Вызываем тестируемый метод
            const result = await shoppingListApplicationService.markItemAsNotPurchased(userId, itemId);
            
            // Проверяем вызов метода доменного сервиса
            expect(mockShoppingListService.markItemAsNotPurchased).toHaveBeenCalledWith(userId, itemId);
            
            // Проверяем результат
            expect(result).toEqual(expect.objectContaining({
                id: itemId,
                purchased: false,
                purchasedDate: null
            }));
        });
    });

    describe('getCategories', () => {
        it('должен успешно получить категории пользователя', async () => {
            // Создаем тестовые данные
            const userId = 'test-user-id';
            
            // Создаем тестовые объекты категорий
            const userIdObj = UserId.fromString(userId);
            
            // Создаем категории с правильной сигнатурой
            const category1 = Category.create(userIdObj, 'Категория 1');
            const category2 = Category.create(userIdObj, 'Категория 2');
            
            // Устанавливаем ID вручную
            (category1 as any)._id = CategoryId.fromString('cat-1');
            (category2 as any)._id = CategoryId.fromString('cat-2');
            
            // Настраиваем мок
            mockShoppingListService.getCategories.mockResolvedValue([category1, category2]);
            
            // Вызываем тестируемый метод
            const result = await shoppingListApplicationService.getCategories(userId);
            
            // Проверяем вызов метода доменного сервиса
            expect(mockShoppingListService.getCategories).toHaveBeenCalledWith(userId);
            
            // Проверяем результат
            expect(result).toHaveLength(2);
            expect(result[0]).toEqual(expect.objectContaining({
                id: 'cat-1',
                name: 'Категория 1',
                userId: userId
            }));
            expect(result[1]).toEqual(expect.objectContaining({
                id: 'cat-2',
                name: 'Категория 2',
                userId: userId
            }));
        });
    });

    describe('getItems', () => {
        it('должен успешно получить элементы списка покупок', async () => {
            // Создаем тестовые данные
            const userId = 'test-user-id';
            const categoryId = 'test-category-id';
            
            // Создаем тестовые объекты элементов
            const userIdObj = UserId.fromString(userId);
            const categoryIdObj = CategoryId.fromString(categoryId);
            
            // Создаем элементы с правильной сигнатурой
            const item1 = ShoppingListItem.create(
                userIdObj, 
                categoryIdObj, 
                'Товар 1', 
                Quantity.create(1)
            );
            
            const item2 = ShoppingListItem.create(
                userIdObj, 
                categoryIdObj, 
                'Товар 2', 
                Quantity.create(2, 'кг')
            );
            
            // Устанавливаем ID элементов вручную
            (item1 as any)._id = ItemId.fromString('item-1');
            (item2 as any)._id = ItemId.fromString('item-2');
            
            // Настраиваем мок
            mockShoppingListService.getItems.mockResolvedValue([item1, item2]);
            
            // Вызываем тестируемый метод
            const result = await shoppingListApplicationService.getItems(userId, categoryId);
            
            // Проверяем вызов метода доменного сервиса
            expect(mockShoppingListService.getItems).toHaveBeenCalledWith(userId, categoryId);
            
            // Проверяем результат
            expect(result).toHaveLength(2);
            expect(result[0]).toEqual(expect.objectContaining({
                id: 'item-1',
                name: 'Товар 1',
                userId: userId,
                categoryId: categoryId,
                quantity: 1
            }));
            expect(result[1]).toEqual(expect.objectContaining({
                id: 'item-2',
                name: 'Товар 2',
                userId: userId,
                categoryId: categoryId,
                quantity: 2
            }));
        });
    });
}); 