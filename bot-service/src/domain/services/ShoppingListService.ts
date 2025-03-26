import { ShoppingList } from '../aggregates/ShoppingList';
import { Category } from '../entities/Category';
import { ShoppingListItem } from '../entities/ShoppingListItem';
import { DomainException } from '../exceptions/DomainException';
import { ICategoryRepository } from '../repositories/ICategoryRepository';
import { IItemRepository } from '../repositories/IItemRepository';
import { CategoryId } from '../value-objects/CategoryId';
import { ItemId } from '../value-objects/ItemId';
import { Quantity } from '../value-objects/Quantity';
import { UserId } from '../value-objects/UserId';
import { IUserAccessRepository } from '../repositories/IUserAccessRepository';
import { CategoryName } from '../value-objects/CategoryName';
import { ItemName } from '../value-objects/ItemName';
import { ShareCode } from '../value-objects/ShareCode';

/**
 * Доменный сервис для работы со списком покупок.
 * Содержит бизнес-логику, которая работает с несколькими агрегатами или требует взаимодействия с репозиториями.
 */
export class ShoppingListService {
    private readonly categoryRepository: ICategoryRepository;
    private readonly itemRepository: IItemRepository;
    private readonly userAccessRepository: IUserAccessRepository;

    constructor(
        categoryRepository: ICategoryRepository,
        itemRepository: IItemRepository,
        userAccessRepository: IUserAccessRepository
    ) {
        this.categoryRepository = categoryRepository;
        this.itemRepository = itemRepository;
        this.userAccessRepository = userAccessRepository;
    }

    /**
     * Загружает или создает список покупок для пользователя.
     */
    public async getOrCreateShoppingList(userId: UserId): Promise<ShoppingList> {
        // Загружаем категории и элементы пользователя
        const categories = await this.categoryRepository.findByUserId(userId);
        const items = await this.itemRepository.findByUserId(userId);
        
        // Восстанавливаем агрегат
        return ShoppingList.reconstitute(userId, categories, items);
    }

    /**
     * Добавляет новую категорию для пользователя.
     */
    public async addCategory(userId: UserId, name: CategoryName): Promise<Category> {
        try {
            // Добавляем категорию в агрегат
            const shoppingList = await this.getOrCreateShoppingList(userId);
            const category = shoppingList.addCategory(name.value);
            
            // Сохраняем в репозиторий
            await this.categoryRepository.save(category);
            
            return category;
        } catch (error) {
            if (error instanceof DomainException) {
                throw error;
            }
            throw new Error(`Ошибка при добавлении категории: ${error}`);
        }
    }

    /**
     * Переименовывает категорию.
     */
    public async renameCategory(userId: UserId, categoryId: CategoryId, newName: CategoryName): Promise<Category> {
        const category = await this.categoryRepository.findById(categoryId);
        if (!category) {
            throw new DomainException('категория не найдена');
        }
        
        if (!category.getUserId().equals(userId)) {
            throw new DomainException('у вас нет прав на редактирование этой категории');
        }
        
        category.rename(newName.value);
        await this.categoryRepository.save(category);
        
        return category;
    }

    /**
     * Удаляет категорию и все ее элементы.
     */
    public async removeCategory(userId: UserId, categoryId: CategoryId): Promise<void> {
        const category = await this.categoryRepository.findById(categoryId);
        if (!category) {
            throw new DomainException('категория не найдена');
        }
        
        if (!category.getUserId().equals(userId)) {
            throw new DomainException('у вас нет прав на удаление этой категории');
        }
        
        await this.itemRepository.removeByCategory(categoryId);
        await this.categoryRepository.remove(categoryId);
    }

    /**
     * Добавляет новый элемент в список покупок.
     */
    public async addItem(
        userId: UserId, 
        categoryId: CategoryId, 
        name: ItemName, 
        quantity: Quantity
    ): Promise<ShoppingListItem> {
        const shoppingList = await this.getOrCreateShoppingList(userId);
        
        try {
            // Добавляем элемент в агрегат
            const item = shoppingList.addItem(categoryId, name.value, quantity);
            
            // Сохраняем в репозиторий
            await this.itemRepository.save(item);
            
            return item;
        } catch (error) {
            if (error instanceof DomainException) {
                throw error;
            }
            throw new Error(`Ошибка при добавлении элемента: ${error}`);
        }
    }

    /**
     * Отмечает элемент как купленный.
     */
    public async markItemAsPurchased(userId: UserId, itemId: ItemId): Promise<ShoppingListItem> {
        const shoppingList = await this.getOrCreateShoppingList(userId);
        
        try {
            // Получаем элемент для проверки
            const item = shoppingList.getItemById(itemId);
            
            // Проверяем, что элемент принадлежит пользователю
            if (!item.userId.equals(userId)) {
                throw new DomainException('элемент не принадлежит пользователю');
            }
            
            // Отмечаем как купленный
            shoppingList.markItemAsPurchased(itemId);
            
            // Сохраняем изменения
            await this.itemRepository.save(item);
            
            // Если это элемент из общего списка или элемент, которым поделились,
            // обновляем связанный элемент
            if (item.linkedItemId) {
                // Это элемент из общего списка, обновляем оригинальный элемент
                const originalItemId = ItemId.create(item.linkedItemId);
                const originalItem = await this.itemRepository.findById(originalItemId);
                
                if (originalItem && !originalItem.purchased) {
                    // Находим владельца оригинального элемента
                    const ownerUserId = originalItem.userId;
                    
                    // Отмечаем оригинальный элемент как купленный
                    const ownerShoppingList = await this.getOrCreateShoppingList(ownerUserId);
                    ownerShoppingList.markItemAsPurchased(originalItemId);
                    await this.itemRepository.save(originalItem);
                }
            } else {
                // Это оригинальный элемент, обновляем все связанные элементы
                const linkedItems = await this.findLinkedItems(itemId);
                
                for (const linkedItem of linkedItems) {
                    if (!linkedItem.purchased) {
                        const linkedShoppingList = await this.getOrCreateShoppingList(linkedItem.userId);
                        linkedShoppingList.markItemAsPurchased(linkedItem.id);
                        await this.itemRepository.save(linkedItem);
                    }
                }
            }
            
            return item;
        } catch (error) {
            if (error instanceof DomainException) {
                throw error;
            }
            throw new Error(`Ошибка при отметке элемента как купленного: ${error}`);
        }
    }

    /**
     * Отмечает элемент как не купленный.
     */
    public async markItemAsNotPurchased(userId: UserId, itemId: ItemId): Promise<ShoppingListItem> {
        const shoppingList = await this.getOrCreateShoppingList(userId);
        
        try {
            // Получаем элемент для проверки
            const item = shoppingList.getItemById(itemId);
            
            // Проверяем, что элемент принадлежит пользователю
            if (!item.userId.equals(userId)) {
                throw new DomainException('элемент не принадлежит пользователю');
            }
            
            // Отмечаем как не купленный
            shoppingList.markItemAsNotPurchased(itemId);
            
            // Сохраняем изменения
            await this.itemRepository.save(item);
            
            // Если это элемент из общего списка или элемент, которым поделились,
            // обновляем связанный элемент
            if (item.linkedItemId) {
                // Это элемент из общего списка, обновляем оригинальный элемент
                const originalItemId = ItemId.create(item.linkedItemId);
                const originalItem = await this.itemRepository.findById(originalItemId);
                
                if (originalItem && originalItem.purchased) {
                    // Находим владельца оригинального элемента
                    const ownerUserId = originalItem.userId;
                    
                    // Отмечаем оригинальный элемент как не купленный
                    const ownerShoppingList = await this.getOrCreateShoppingList(ownerUserId);
                    ownerShoppingList.markItemAsNotPurchased(originalItemId);
                    await this.itemRepository.save(originalItem);
                }
            } else {
                // Это оригинальный элемент, обновляем все связанные элементы
                const linkedItems = await this.findLinkedItems(itemId);
                
                for (const linkedItem of linkedItems) {
                    if (linkedItem.purchased) {
                        const linkedShoppingList = await this.getOrCreateShoppingList(linkedItem.userId);
                        linkedShoppingList.markItemAsNotPurchased(linkedItem.id);
                        await this.itemRepository.save(linkedItem);
                    }
                }
            }
            
            return item;
        } catch (error) {
            if (error instanceof DomainException) {
                throw error;
            }
            throw new Error(`Ошибка при отметке элемента как не купленного: ${error}`);
        }
    }

    /**
     * Изменяет количество элемента.
     */
    public async updateItemQuantity(
        userId: UserId, 
        itemId: ItemId, 
        quantity: Quantity
    ): Promise<ShoppingListItem> {
        const shoppingList = await this.getOrCreateShoppingList(userId);
        
        try {
            // Получаем элемент для проверки
            const item = shoppingList.getItemById(itemId);
            
            // Проверяем, что элемент принадлежит пользователю
            if (!item.userId.equals(userId)) {
                throw new DomainException('элемент не принадлежит пользователю');
            }
            
            // Изменяем количество
            shoppingList.updateItemQuantity(itemId, quantity);
            
            // Сохраняем изменения
            await this.itemRepository.save(item);
            
            return item;
        } catch (error) {
            if (error instanceof DomainException) {
                throw error;
            }
            throw new Error(`Ошибка при изменении количества элемента: ${error}`);
        }
    }

    /**
     * Удаляет элемент из списка покупок.
     */
    public async removeItem(userId: UserId, itemId: ItemId): Promise<void> {
        const shoppingList = await this.getOrCreateShoppingList(userId);
        
        try {
            // Получаем элемент для проверки
            const item = shoppingList.getItemById(itemId);
            
            // Проверяем, что элемент принадлежит пользователю
            if (!item.userId.equals(userId)) {
                throw new DomainException('элемент не принадлежит пользователю');
            }
            
            // Удаляем элемент из агрегата
            shoppingList.removeItem(itemId);
            
            // Удаляем из репозитория
            await this.itemRepository.remove(itemId);
        } catch (error) {
            if (error instanceof DomainException) {
                throw error;
            }
            throw new Error(`Ошибка при удалении элемента: ${error}`);
        }
    }

    /**
     * Очищает все купленные элементы из списка.
     */
    public async clearPurchasedItems(userId: UserId): Promise<void> {
        const shoppingList = await this.getOrCreateShoppingList(userId);
        
        try {
            // Получаем список купленных элементов перед очисткой
            const purchasedItems = shoppingList.getPurchasedItems();
            
            // Очищаем купленные элементы в агрегате
            shoppingList.clearPurchasedItems();
            
            // Удаляем из репозитория
            for (const item of purchasedItems) {
                await this.itemRepository.remove(item.id);
            }
        } catch (error) {
            if (error instanceof DomainException) {
                throw error;
            }
            throw new Error(`Ошибка при очистке купленных элементов: ${error}`);
        }
    }

    /**
     * Получает список категорий пользователя.
     */
    public async getCategories(userId: UserId): Promise<Category[]> {
        try {
            return await this.categoryRepository.findByUserId(userId);
        } catch (error) {
            if (error instanceof DomainException) {
                throw error;
            }
            throw new Error(`Ошибка при получении категорий: ${error}`);
        }
    }

    /**
     * Получает список элементов пользователя.
     */
    public async getItems(userId: UserId, categoryId?: CategoryId): Promise<ShoppingListItem[]> {
        if (categoryId) {
            // Если указан ID категории, получаем элементы только для этой категории
            return await this.itemRepository.findByCategory(categoryId);
        }
        
        // Получаем все элементы пользователя
        return await this.itemRepository.findByUserId(userId);
    }

    /**
     * Создает код доступа для совместного использования списка
     */
    public async createShareCode(userId: UserId, categoryId: CategoryId, shareCode: ShareCode): Promise<void> {
        const category = await this.categoryRepository.findById(categoryId);
        if (!category) {
            throw new DomainException('категория не найдена');
        }
        
        if (!category.getUserId().equals(userId)) {
            throw new DomainException('у вас нет прав на изменение этой категории');
        }
        
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7); // Код действителен 7 дней
        
        await this.categoryRepository.saveShareCode(categoryId, shareCode.value, expiryDate);
    }
    
    /**
     * Присоединение к списку по коду доступа
     */
    public async joinSharedList(userId: UserId, shareCode: ShareCode): Promise<Category> {
        // Находим категорию по коду доступа
        const originalCategory = await this.categoryRepository.findByShareCode(shareCode.value);
        if (!originalCategory) {
            throw new DomainException('неверный код доступа');
        }
        
        // Проверяем срок действия кода
        const shareCodeExpiry = await this.categoryRepository.getShareCodeExpiry(originalCategory.getId());
        if (!shareCodeExpiry || shareCodeExpiry < new Date()) {
            throw new DomainException('срок действия кода доступа истек');
        }
        
        // Проверяем, что пользователь не пытается поделиться списком с самим собой
        if (originalCategory.getUserId().equals(userId)) {
            throw new DomainException('вы не можете поделиться списком с самим собой');
        }
        
        // Проверяем, не создал ли пользователь уже общую категорию
        const userCategories = await this.categoryRepository.findByUserId(userId);
        const existingSharedCategory = userCategories.find(
            c => c.getName() === `${originalCategory.getName()} (общий)`
        );
        
        if (existingSharedCategory) {
            return existingSharedCategory;
        }
        
        // Создаем новую категорию для пользователя
        const category = Category.create(
            userId,
            `${originalCategory.getName()} (общий)`
        );
        
        // Связываем с оригинальной категорией
        category.setLinkedCategoryId(originalCategory.getId().value);
        
        // Сохраняем категорию
        await this.categoryRepository.save(category);
        
        // Синхронизируем элементы
        await this.syncSharedListItems(userId, category.getId());
        
        return category;
    }
    
    /**
     * Синхронизирует элементы между двумя списками
     */
    public async syncSharedListItems(userId: UserId, categoryId: CategoryId): Promise<void> {
        const category = await this.categoryRepository.findById(categoryId);
        if (!category) {
            throw new DomainException('категория не найдена');
        }
        
        const linkedCategoryIdObj = category.getLinkedCategoryId();
        if (!linkedCategoryIdObj) {
            throw new DomainException('категория не является общей');
        }
        
        // Получаем связанную категорию
        const linkedCategoryId = CategoryId.create(linkedCategoryIdObj.value);
        const originalCategory = await this.categoryRepository.findById(linkedCategoryId);
        
        if (!originalCategory) {
            throw new DomainException('оригинальная категория не найдена');
        }
        
        // Получаем элементы оригинальной категории
        const originalItems = await this.itemRepository.findByCategory(linkedCategoryId);
        
        // Получаем текущие элементы общей категории
        const sharedItems = await this.itemRepository.findByCategory(categoryId);
        
        // Обновляем существующие элементы и добавляем новые
        const sharedItemsMap = new Map<string, ShoppingListItem>();
        for (const sharedItem of sharedItems) {
            if (sharedItem.linkedItemId) {
                sharedItemsMap.set(sharedItem.linkedItemId, sharedItem);
            }
        }
        
        // Проходим по элементам оригинальной категории
        for (const originalItem of originalItems) {
            const sharedItem = sharedItemsMap.get(originalItem.id.value);
            
            if (!sharedItem) {
                // Создаем новый элемент в общей категории
                const newItem = ShoppingListItem.create(
                    userId,
                    categoryId,
                    originalItem.name,
                    originalItem.quantity
                );
                
                // Устанавливаем связь с оригинальным элементом
                newItem.setLinkedItemId(originalItem.id.value);
                
                // Если оригинальный элемент куплен, отмечаем и новый как купленный
                if (originalItem.purchased) {
                    newItem.markAsPurchased();
                }
                
                await this.itemRepository.save(newItem);
            } else {
                // Обновляем существующий элемент в общей категории
                // только если он не был изменен локально
                if (originalItem.updatedAt && sharedItem.updatedAt && 
                    originalItem.updatedAt > sharedItem.updatedAt) {
                    sharedItem.rename(originalItem.name);
                    sharedItem.updateQuantity(originalItem.quantity);
                    
                    if (originalItem.purchased && !sharedItem.purchased) {
                        sharedItem.markAsPurchased();
                    }
                    
                    await this.itemRepository.save(sharedItem);
                }
            }
        }
    }
    
    /**
     * Находит все элементы, связанные с указанным элементом.
     */
    private async findLinkedItems(itemId: ItemId): Promise<ShoppingListItem[]> {
        // Получаем все элементы
        const allItems = await this.itemRepository.findAll();
        
        // Фильтруем те, которые связаны с указанным элементом
        return allItems.filter(item => item.linkedItemId === itemId.value);
    }

    /**
     * Отзывает доступ к списку покупок другому пользователю
     */
    public async revokeListAccess(ownerUserId: UserId, categoryId: CategoryId, targetUserId: UserId): Promise<void> {
        // Проверяем, что текущий пользователь является владельцем категории
        const category = await this.categoryRepository.findById(categoryId);
        if (!category) {
            throw new DomainException('категория не найдена');
        }
        
        if (!category.getUserId().equals(ownerUserId)) {
            throw new DomainException('у вас нет прав на управление доступом к этой категории');
        }
        
        // Удаляем запись о доступе
        await this.userAccessRepository.revokeAccess(targetUserId, categoryId);
        
        // Находим связанную категорию у целевого пользователя
        const targetUserCategories = await this.categoryRepository.findByUserId(targetUserId);
        const targetCategory = targetUserCategories.find(c => {
            const linkedId = c.getLinkedCategoryId();
            return linkedId && linkedId.value === categoryId.value;
        });
        
        if (targetCategory) {
            // Удаляем элементы категории
            await this.itemRepository.removeByCategory(targetCategory.getId());
            
            // Удаляем саму категорию
            await this.categoryRepository.remove(targetCategory.getId());
        }
    }
    
    /**
     * Получает список пользователей с доступом к категории
     */
    public async getUsersWithAccess(userId: UserId, categoryId: CategoryId): Promise<{ id: string, isOwner: boolean }[]> {
        const category = await this.categoryRepository.findById(categoryId);
        if (!category) {
            throw new DomainException('категория не найдена');
        }
        
        if (!category.getUserId().equals(userId)) {
            throw new DomainException('у вас нет прав на просмотр пользователей с доступом к этой категории');
        }
        
        const result = [
            { id: category.getUserId().value, isOwner: true }
        ];
        
        // Получаем всех пользователей с доступом
        const usersWithAccess = await this.userAccessRepository.findUserIdsByCategoryId(categoryId);
        
        // Добавляем пользователей с доступом
        for (const user of usersWithAccess) {
            if (!userId.equals(user)) {
                result.push({ id: user.value, isOwner: false });
            }
        }
        
        return result;
    }

    /**
     * Обновляет товар с новыми данными
     */
    private async updateLinkedItem(item: ShoppingListItem, originalItem: ShoppingListItem): Promise<void> {
        // Обновляем оригинальный элемент на основе связанного
        originalItem.updateQuantity(item.quantity);
        
        if (item.purchased && !originalItem.purchased) {
            originalItem.markAsPurchased();
        } else if (!item.purchased && originalItem.purchased) {
            originalItem.markAsNotPurchased();
        }
        
        await this.itemRepository.save(originalItem);
    }
} 