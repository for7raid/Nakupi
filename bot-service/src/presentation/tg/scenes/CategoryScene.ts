import { Markup, Scenes } from 'telegraf';
import { BotContext } from '../types/session';
import { ShoppingService } from '../../../application/services/ShoppingService';
import logger from '../../../infrastructure/logging/Logger';
import metricsService from '../../../infrastructure/monitoring';
import { Category } from '../../../domain/models/Category';
import { ShoppingListItem } from '../../../domain/models/ShoppingListItem';
import { MAIN_MENU_SCENE_ID } from './MainMenuScene';

export const CATEGORY_SCENE_ID = 'CATEGORY_SCENE';
export const SHOW_PURCHASED_SCENE_ID = 'SHOW_PURCHASED_SCENE';

interface CategorySceneState {
    showPurchased: boolean;
}

export class CategoryScene {
    constructor(private shoppingService: ShoppingService) {}

    getCategoryScene(): Scenes.BaseScene<BotContext> {
        const scene = new Scenes.BaseScene<BotContext>(CATEGORY_SCENE_ID);

        // Обработчик входа в сцену
        scene.enter(async (ctx) => {
            logger.debug('Вход в сцену категории');
            
            // Инициализируем состояние сцены, если его нет
            if (!ctx.scene.state) {
                ctx.scene.state = {} as CategorySceneState;
            }
            
            // Устанавливаем флаг показа купленных элементов на false при входе
            const state = ctx.scene.state as CategorySceneState;
            if (state.showPurchased === undefined) {
                state.showPurchased = false;
            }
            
            await this.showCategoryMenu(ctx);
        });

        // Обработчик кнопки "Добавить элемент"
        scene.action('add_item', async (ctx) => {
            logger.debug('Выбрано добавление элемента');
            await ctx.answerCbQuery();
            ctx.session.waitingForItemInput = true; // Устанавливаем флаг ожидания ввода
            await this.showAddItemForm(ctx);
        });

        // Обработчик кнопки "Показать купленные/не купленные"
        scene.action('toggle_purchased', async (ctx) => {
            logger.debug('Переключение отображения купленных элементов');
            await ctx.answerCbQuery();
            
            // Инициализируем состояние, если его нет
            if (!ctx.scene.state) {
                ctx.scene.state = {} as CategorySceneState;
            }
            
            // Переключаем состояние
            const state = ctx.scene.state as CategorySceneState;
            state.showPurchased = !state.showPurchased;
            
            // Показываем обновленный список
            await this.showCategoryMenu(ctx);
        });

        // Обработчик кнопки "Назад"
        scene.action('back_to_main', async (ctx) => {
            logger.debug('Возврат в главное меню');
            await ctx.answerCbQuery();
            await ctx.scene.enter(MAIN_MENU_SCENE_ID);
        });
        
        // Обработчик кнопки "Назад к категории"
        scene.action('back_to_category', async (ctx) => {
            logger.debug('Возврат к категории');
            await ctx.answerCbQuery();
            ctx.session.waitingForItemInput = false; // Сбрасываем флаг ожидания ввода
            await this.showCategoryMenu(ctx);
        });
        
        // Обработчик toggle элемента (отметка о покупке)
        scene.action(/toggle_item_(.+)/, async (ctx) => {
            try {
                const itemId = ctx.match[1];
                logger.debug('Переключение статуса элемента', { itemId });
                await ctx.answerCbQuery();
                
                // Находим элемент в списке
                const itemIndex = ctx.session.items.findIndex((item: ShoppingListItem) => item.id === itemId);
                if (itemIndex !== -1) {
                    const item = ctx.session.items[itemIndex];
                    
                    // Если элемент отмечен как купленный, возвращаем его в список некупленных
                    if (item.purchased) {
                        // Просто меняем статус
                        await this.shoppingService.markAsNotPurchased(itemId);
                        ctx.session.items[itemIndex].purchased = false;
                    } else {
                        // Элемент не купленный, нужно отметить его как купленный
                        
                        // Если количество больше 1, уменьшаем на 1 и создаем новый элемент или добавляем к существующему
                        if (item.quantity > 1) {
                            // Уменьшаем количество текущего элемента
                            const newQuantity = item.quantity - 1;
                            ctx.session.items[itemIndex].quantity = newQuantity;
                            await this.shoppingService.updateItemQuantity(itemId, newQuantity);
                            
                            // Проверяем, есть ли уже купленный товар с таким же названием в этой категории
                            const existingPurchasedItems = ctx.session.items.filter(
                                (existingItem: ShoppingListItem) => 
                                    existingItem.name === item.name && 
                                    existingItem.purchased === true && 
                                    existingItem.categoryId === item.categoryId
                            );
                            
                            if (existingPurchasedItems.length > 0) {
                                // Берем первый существующий купленный товар и увеличиваем его количество
                                const existingItem = existingPurchasedItems[0];
                                const existingItemIndex = ctx.session.items.findIndex(
                                    (i: ShoppingListItem) => i.id === existingItem.id
                                );
                                
                                const updatedQuantity = existingItem.quantity + 1;
                                ctx.session.items[existingItemIndex].quantity = updatedQuantity;
                                await this.shoppingService.updateItemQuantity(
                                    existingItem.id as string, 
                                    updatedQuantity
                                );
                                
                                // Если есть другие дубликаты этого товара в купленных, удаляем их после увеличения количества первого
                                if (existingPurchasedItems.length > 1) {
                                    for (let i = 1; i < existingPurchasedItems.length; i++) {
                                        const duplicateId = existingPurchasedItems[i].id;
                                        if (duplicateId) {
                                            await this.shoppingService.removeItem(duplicateId);
                                            // Удаляем из локального списка
                                            const duplicateIndex = ctx.session.items.findIndex(
                                                (item: ShoppingListItem) => item.id === duplicateId
                                            );
                                            if (duplicateIndex !== -1) {
                                                ctx.session.items.splice(duplicateIndex, 1);
                                            }
                                        }
                                    }
                                }
                            } else {
                                // Создаем новый элемент с количеством 1 и отмечаем его как купленный
                                const newPurchasedItem: ShoppingListItem = {
                                    name: item.name,
                                    quantity: 1,
                                    purchased: true,
                                    userId: item.userId,
                                    categoryId: item.categoryId
                                };
                                
                                // Добавляем в базу данных
                                const addedItem = await this.shoppingService.addItem(newPurchasedItem);
                                ctx.session.items.push(addedItem);
                            }
                        } else {
                            // Если количество = 1, просто отмечаем как купленный
                            // Но сначала проверяем, нет ли уже такого товара в купленных
                            const existingPurchasedItems = ctx.session.items.filter(
                                (existingItem: ShoppingListItem) => 
                                    existingItem.name === item.name && 
                                    existingItem.purchased === true && 
                                    existingItem.categoryId === item.categoryId
                            );
                            
                            if (existingPurchasedItems.length > 0) {
                                // Если такой товар уже есть в купленных, увеличиваем его количество
                                // и удаляем текущий
                                const existingItem = existingPurchasedItems[0];
                                const existingItemIndex = ctx.session.items.findIndex(
                                    (i: ShoppingListItem) => i.id === existingItem.id
                                );
                                
                                const updatedQuantity = existingItem.quantity + 1;
                                ctx.session.items[existingItemIndex].quantity = updatedQuantity;
                                await this.shoppingService.updateItemQuantity(
                                    existingItem.id as string, 
                                    updatedQuantity
                                );
                                
                                // Удаляем текущий товар
                                await this.shoppingService.removeItem(itemId);
                                ctx.session.items.splice(itemIndex, 1);
                                
                                // Если есть другие дубликаты, удаляем их тоже
                                if (existingPurchasedItems.length > 1) {
                                    for (let i = 1; i < existingPurchasedItems.length; i++) {
                                        const duplicateId = existingPurchasedItems[i].id;
                                        if (duplicateId) {
                                            await this.shoppingService.removeItem(duplicateId);
                                            // Удаляем из локального списка
                                            const duplicateIndex = ctx.session.items.findIndex(
                                                (item: ShoppingListItem) => item.id === duplicateId
                                            );
                                            if (duplicateIndex !== -1) {
                                                ctx.session.items.splice(duplicateIndex, 1);
                                            }
                                        }
                                    }
                                }
                            } else {
                                // Просто отмечаем текущий товар как купленный
                                await this.shoppingService.markAsPurchased(itemId);
                                ctx.session.items[itemIndex].purchased = true;
                            }
                        }
                    }
                    
                    // Обновляем отображение меню категории
                    await this.showCategoryMenu(ctx);
                } else {
                    await ctx.reply('❌ Элемент не найден');
                }
            } catch (error) {
                logger.error('Ошибка при переключении статуса элемента:', error);
                await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
            }
        });
        
        // Обработчик для удаления элемента
        scene.action(/delete_item_(.+)/, async (ctx) => {
            try {
                const itemId = ctx.match[1];
                logger.debug('Удаление элемента', { itemId });
                await ctx.answerCbQuery();
                
                // Находим элемент в списке
                const itemIndex = ctx.session.items.findIndex((item: ShoppingListItem) => item.id === itemId);
                if (itemIndex !== -1) {
                    const item = ctx.session.items[itemIndex];
                    
                    // Удаляем элемент из базы данных
                    await this.shoppingService.removeItem(itemId);
                    
                    // Удаляем элемент из сессии
                    ctx.session.items.splice(itemIndex, 1);
                    
                    await ctx.reply(`✅ Элемент "${item.name}" удален`);
                    
                    // Обновляем отображение меню категории
                    await this.showCategoryMenu(ctx);
                } else {
                    await ctx.reply('❌ Элемент не найден');
                }
            } catch (error) {
                logger.error('Ошибка при удалении элемента:', error);
                await ctx.reply('❌ Произошла ошибка при удалении элемента. Пожалуйста, попробуйте позже.');
            }
        });
        
        // Обработчик текстовых сообщений для добавления элемента
        scene.on('text', async (ctx) => {
            if (!ctx.session.waitingForItemInput) {
                return; // Если не ожидаем ввод, игнорируем сообщение
            }
            
            const text = ctx.message.text;
            logger.debug('Получен ввод для нового элемента', { text });
            
            try {
                // Разбираем ввод на название и количество
                const parts = text.split(',').map(part => part.trim());
                const name = parts[0];
                const quantity = parseInt(parts[1], 10) || 1;
                
                if (!name) {
                    await ctx.reply('❌ Пожалуйста, введите название элемента');
                    return;
                }
                
                const userId = ctx.from?.id.toString();
                const categoryId = ctx.session.currentCategoryId;
                
                if (!userId || !categoryId) {
                    await ctx.reply('❌ Ошибка идентификации пользователя или категории');
                    return;
                }
                
                // Создаем новый элемент
                const newItem: ShoppingListItem = {
                    name,
                    quantity,
                    purchased: false,
                    userId,
                    categoryId
                };
                
                // Добавляем в базу данных
                const addedItem = await this.shoppingService.addItem(newItem);
                
                // Обновляем локальное состояние
                if (!ctx.session.items) {
                    ctx.session.items = [];
                }
                ctx.session.items.push(addedItem);
                
                // Сбрасываем флаг ожидания ввода
                ctx.session.waitingForItemInput = false;
                
                await ctx.reply(`✅ Элемент "${name}" (${quantity}) добавлен`);
                await this.showCategoryMenu(ctx);
            } catch (error) {
                logger.error('Ошибка при добавлении элемента:', error);
                await ctx.reply('❌ Произошла ошибка. Пожалуйста, проверьте формат ввода и попробуйте снова.');
            }
        });

        return scene;
    }

    getShowPurchasedScene(): Scenes.BaseScene<BotContext> {
        const scene = new Scenes.BaseScene<BotContext>(SHOW_PURCHASED_SCENE_ID);

        // Обработчик входа в сцену - просто перенаправляем в основную сцену с флагом showPurchased
        scene.enter(async (ctx) => {
            logger.debug('Вход в сцену отображения купленных элементов');
            
            // Перенаправляем в основную сцену и устанавливаем флаг
            ctx.scene.state = { showPurchased: true } as CategorySceneState;
            await ctx.scene.enter(CATEGORY_SCENE_ID);
        });

        return scene;
    }

    private async showCategoryMenu(ctx: BotContext): Promise<void> {
        try {
            const userId = ctx.from?.id.toString();
            if (!userId) {
                await ctx.reply('❌ Ошибка идентификации пользователя');
                return;
            }

            const categoryId = ctx.session.currentCategoryId;
            if (!categoryId) {
                await ctx.reply('❌ Категория не выбрана');
                return;
            }

            const categories = ctx.session.categories;
            const currentCategory = categories.find((cat: Category) => cat.id === categoryId);
            if (!currentCategory) {
                await ctx.reply('❌ Категория не найдена');
                return;
            }

            let allItems = ctx.session.items || [];
            const categoryItems = allItems.filter((item: ShoppingListItem) => item.categoryId === categoryId);
            const purchasedItems = categoryItems.filter((item: ShoppingListItem) => item.purchased);
            const notPurchasedItems = categoryItems.filter((item: ShoppingListItem) => !item.purchased);

            // Инициализируем состояние, если оно отсутствует
            if (!ctx.scene.state) {
                ctx.scene.state = { showPurchased: false } as CategorySceneState;
            }
            
            const state = ctx.scene.state as CategorySceneState;
            if (state.showPurchased === undefined) {
                state.showPurchased = false;
            }
            
            // Определяем, какие элементы показывать
            const itemsToShow = state.showPurchased ? purchasedItems : notPurchasedItems;

            // Создаем кнопки для элементов с возможностью удаления
            // Каждый товар теперь занимает отдельную строку с кнопкой удаления
            const itemButtons = [];
            
            for (const item of itemsToShow) {
                const status = item.purchased ? '✅' : '⬜️';
                itemButtons.push([
                    Markup.button.callback(`${status} ${item.name} (${item.quantity})`, `toggle_item_${item.id}`),
                    Markup.button.callback('🗑️', `delete_item_${item.id}`)
                ]);
            }

            // Готовим текст кнопки переключения режима
            const toggleButtonText = state.showPurchased 
                ? '🛒 Показать не купленные' 
                : '✅ Показать купленные';

            const keyboard = [
                ...itemButtons,
                [
                    Markup.button.callback('➕ Добавить элемент', 'add_item'),
                    Markup.button.callback(toggleButtonText, 'toggle_purchased')
                ],
                [Markup.button.callback('⬅️ Назад', 'back_to_main')]
            ];

            // Добавляем индикатор текущего режима в заголовок
            const viewModeText = state.showPurchased 
                ? '(режим просмотра: купленные)' 
                : '(режим просмотра: к покупке)';

            await ctx.reply(
                `📋 ${currentCategory.name} ${viewModeText}\n\n${this.formatItemsList(categoryItems)}`,
                Markup.inlineKeyboard(keyboard)
            );
        } catch (error) {
            logger.error('Ошибка при отображении меню категории:', error);
            await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
        }
    }

    private async showAddItemForm(ctx: BotContext): Promise<void> {
        try {
            await ctx.reply(
                'Введите название элемента и количество через запятую (например: Молоко, 2)',
                Markup.inlineKeyboard([
                    [Markup.button.callback('⬅️ Назад', 'back_to_category')]
                ])
            );
        } catch (error) {
            logger.error('Ошибка при отображении формы добавления элемента:', error);
            await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
        }
    }

    private async showPurchasedItems(ctx: BotContext): Promise<void> {
        try {
            // Инициализируем состояние если его нет
            if (!ctx.scene.state) {
                ctx.scene.state = {} as CategorySceneState;
            }
            
            const state = ctx.scene.state as CategorySceneState;
            state.showPurchased = true;
            await this.showCategoryMenu(ctx);
        } catch (error) {
            logger.error('Ошибка при отображении купленных элементов:', error);
            await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
        }
    }

    private formatItemsList(items: ShoppingListItem[]): string {
        const purchasedItems = items.filter(item => item.purchased);
        const notPurchasedItems = items.filter(item => !item.purchased);

        let result = '';

        if (notPurchasedItems.length > 0) {
            result += '🛒 К покупке:\n';
            notPurchasedItems.forEach(item => {
                result += `⬜️ ${item.name} (${item.quantity})\n`;
            });
            result += '\n';
        }

        if (purchasedItems.length > 0) {
            result += '✅ Куплено:\n';
            purchasedItems.forEach(item => {
                result += `✅ ${item.name} (${item.quantity})\n`;
            });
        }

        return result;
    }
} 