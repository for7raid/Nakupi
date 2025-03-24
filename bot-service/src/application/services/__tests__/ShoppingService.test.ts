import { ShoppingService } from '../ShoppingService';
import { ICategoryRepository } from '../../../domain/intefaces/ICategoryRepository';
import { IItemRepository } from '../../../domain/intefaces/IItemRepository';
import { IUserRepository } from '../../../domain/intefaces/IUserRepository';
import { ShoppingListItem } from '../../../domain/models/ShoppingListItem';
import { Category } from '../../../domain/models/Category';
import { User } from '../../../domain/models/User';

describe('ShoppingService', () => {
    let shoppingService: ShoppingService;
    let mockCategoryRepository: jest.Mocked<ICategoryRepository>;
    let mockItemRepository: jest.Mocked<IItemRepository>;
    let mockUserRepository: jest.Mocked<IUserRepository>;

    beforeEach(() => {
        mockCategoryRepository = {
            addCategory: jest.fn(),
            getCategories: jest.fn(),
            removeCategory: jest.fn()
        };

        mockItemRepository = {
            addItem: jest.fn(),
            getItems: jest.fn(),
            removeItem: jest.fn(),
            removeItemsByCategory: jest.fn(),
            markAsPurchased: jest.fn(),
            markAsNotPurchased: jest.fn(),
            updateItemQuantity: jest.fn()
        };

        mockUserRepository = {
            addUser: jest.fn(),
            getUserById: jest.fn(),
            updateUser: jest.fn()
        };

        shoppingService = new ShoppingService(
            mockCategoryRepository,
            mockItemRepository,
            mockUserRepository
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('addItem', () => {
        it('должен успешно добавить элемент списка', async () => {
            const item: ShoppingListItem = {
                id: '1',
                userId: 'user1',
                categoryId: 'cat1',
                name: 'Test Item',
                quantity: 1,
                purchased: false
            };

            mockItemRepository.addItem.mockResolvedValue(item);

            const result = await shoppingService.addItem(item);

            expect(mockItemRepository.addItem).toHaveBeenCalledWith(item);
            expect(result).toEqual(item);
        });

        it('должен выбросить ошибку при невалидном элементе', async () => {
            const invalidItem = {
                id: '1',
                userId: 'user1',
                name: 'Test Item'
            } as ShoppingListItem;

            await expect(shoppingService.addItem(invalidItem)).rejects.toThrow('Невалидный элемент списка покупок');
        });
    });

    describe('removeItem', () => {
        it('должен успешно удалить элемент', async () => {
            const itemId = '1';
            mockItemRepository.removeItem.mockResolvedValue(undefined);

            await shoppingService.removeItem(itemId);

            expect(mockItemRepository.removeItem).toHaveBeenCalledWith(itemId);
        });

        it('должен выбросить ошибку при отсутствии id', async () => {
            await expect(shoppingService.removeItem('')).rejects.toThrow('Идентификатор элемента не указан');
        });
    });

    describe('getItems', () => {
        it('должен успешно получить элементы списка', async () => {
            const userId = 'user1';
            const items: ShoppingListItem[] = [
                {
                    id: '1',
                    userId: 'user1',
                    categoryId: 'cat1',
                    name: 'Test Item',
                    quantity: 1,
                    purchased: false
                }
            ];

            mockItemRepository.getItems.mockResolvedValue(items);

            const result = await shoppingService.getItems(userId);

            expect(mockItemRepository.getItems).toHaveBeenCalledWith(userId, undefined);
            expect(result).toEqual(items);
        });

        it('должен успешно получить элементы по категории', async () => {
            const userId = 'user1';
            const categoryId = 'cat1';
            const items: ShoppingListItem[] = [
                {
                    id: '1',
                    userId: 'user1',
                    categoryId: 'cat1',
                    name: 'Test Item',
                    quantity: 1,
                    purchased: false
                }
            ];

            mockItemRepository.getItems.mockResolvedValue(items);

            const result = await shoppingService.getItems(userId, categoryId);

            expect(mockItemRepository.getItems).toHaveBeenCalledWith(userId, categoryId);
            expect(result).toEqual(items);
        });

        it('должен выбросить ошибку при отсутствии userId', async () => {
            await expect(shoppingService.getItems('')).rejects.toThrow('Идентификатор пользователя не указан');
        });
    });

    describe('markAsPurchased', () => {
        it('должен успешно отметить элемент как купленный', async () => {
            const itemId = '1';
            mockItemRepository.markAsPurchased.mockResolvedValue(undefined);

            await shoppingService.markAsPurchased(itemId);

            expect(mockItemRepository.markAsPurchased).toHaveBeenCalledWith(itemId);
        });

        it('должен выбросить ошибку при отсутствии id', async () => {
            await expect(shoppingService.markAsPurchased('')).rejects.toThrow('Идентификатор элемента не указан');
        });
    });

    describe('markAsNotPurchased', () => {
        it('должен успешно отметить элемент как не купленный', async () => {
            const itemId = '1';
            mockItemRepository.markAsNotPurchased.mockResolvedValue(undefined);

            await shoppingService.markAsNotPurchased(itemId);

            expect(mockItemRepository.markAsNotPurchased).toHaveBeenCalledWith(itemId);
        });

        it('должен выбросить ошибку при отсутствии id', async () => {
            await expect(shoppingService.markAsNotPurchased('')).rejects.toThrow('Идентификатор элемента не указан');
        });
    });

    describe('addCategory', () => {
        it('должен успешно добавить категорию', async () => {
            const category: Category = {
                id: '1',
                userId: 'user1',
                name: 'Test Category'
            };

            mockCategoryRepository.addCategory.mockResolvedValue(category);

            const result = await shoppingService.addCategory(category);

            expect(mockCategoryRepository.addCategory).toHaveBeenCalledWith(category);
            expect(result).toEqual(category);
        });

        it('должен выбросить ошибку при невалидной категории', async () => {
            const invalidCategory = {
                id: '1',
                name: 'Test Category'
            } as Category;

            await expect(shoppingService.addCategory(invalidCategory)).rejects.toThrow('Невалидная категория');
        });
    });

    describe('getCategories', () => {
        it('должен успешно получить категории', async () => {
            const userId = 'user1';
            const categories: Category[] = [
                {
                    id: '1',
                    userId: 'user1',
                    name: 'Test Category'
                }
            ];

            mockCategoryRepository.getCategories.mockResolvedValue(categories);

            const result = await shoppingService.getCategories(userId);

            expect(mockCategoryRepository.getCategories).toHaveBeenCalledWith(userId);
            expect(result).toEqual(categories);
        });

        it('должен выбросить ошибку при отсутствии userId', async () => {
            await expect(shoppingService.getCategories('')).rejects.toThrow('Идентификатор пользователя не указан');
        });
    });

    describe('removeCategory', () => {
        it('должен успешно удалить категорию и все её элементы', async () => {
            const categoryId = '1';
            mockItemRepository.removeItemsByCategory.mockResolvedValue(undefined);
            mockCategoryRepository.removeCategory.mockResolvedValue(undefined);

            await shoppingService.removeCategory(categoryId);

            expect(mockItemRepository.removeItemsByCategory).toHaveBeenCalledWith(categoryId);
            expect(mockCategoryRepository.removeCategory).toHaveBeenCalledWith(categoryId);
        });

        it('должен выбросить ошибку при отсутствии id', async () => {
            await expect(shoppingService.removeCategory('')).rejects.toThrow('Идентификатор категории не указан');
        });
    });

    describe('saveUser', () => {
        it('должен успешно обновить существующего пользователя', async () => {
            const user: User = {
                id: '1',
                name: 'Test User'
            };

            mockUserRepository.getUserById.mockResolvedValue(user);
            mockUserRepository.updateUser.mockResolvedValue(user);

            const result = await shoppingService.saveUser(user);

            expect(mockUserRepository.getUserById).toHaveBeenCalledWith(user.id);
            expect(mockUserRepository.updateUser).toHaveBeenCalledWith(user);
            expect(result).toEqual(user);
        });

        it('должен успешно создать нового пользователя', async () => {
            const user: User = {
                id: '1',
                name: 'Test User'
            };

            mockUserRepository.getUserById.mockResolvedValue(null);
            mockUserRepository.addUser.mockResolvedValue(user);

            const result = await shoppingService.saveUser(user);

            expect(mockUserRepository.getUserById).toHaveBeenCalledWith(user.id);
            expect(mockUserRepository.addUser).toHaveBeenCalledWith(user);
            expect(result).toEqual(user);
        });

        it('должен выбросить ошибку при отсутствии id', async () => {
            const user: User = {
                id: '',
                name: 'Test User'
            };

            await expect(shoppingService.saveUser(user)).rejects.toThrow('Идентификатор пользователя не указан');
        });
    });

    describe('getUser', () => {
        it('должен успешно получить пользователя', async () => {
            const userId = '1';
            const user: User = {
                id: userId,
                name: 'Test User'
            };

            mockUserRepository.getUserById.mockResolvedValue(user);

            const result = await shoppingService.getUser(userId);

            expect(mockUserRepository.getUserById).toHaveBeenCalledWith(userId);
            expect(result).toEqual(user);
        });

        it('должен выбросить ошибку при отсутствии userId', async () => {
            await expect(shoppingService.getUser('')).rejects.toThrow('Идентификатор пользователя не указан');
        });
    });
}); 