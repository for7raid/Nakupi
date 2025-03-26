import { Markup, Scenes } from 'telegraf';
import { BotContext } from '../types/session';
import { IShoppingServiceAdapter } from '../adapters/IShoppingServiceAdapter';
import logger from '../../../infrastructure/logging/Logger';
import metricsService from '../../../infrastructure/monitoring/FileMetricsService';
import { MAIN_MENU_SCENE_ID } from './MainMenuScene';
import { ShoppingListItemDto } from '../../../application/dto/ShoppingListItemDto';
import { CategoryDto } from '../../../application/dto/CategoryDto';

export const CATEGORY_SCENE_ID = 'CATEGORY_SCENE';
export const SHOW_PURCHASED_SCENE_ID = 'SHOW_PURCHASED_SCENE';
export const MANAGE_ACCESS_SCENE_ID = 'MANAGE_ACCESS_SCENE';

interface CategorySceneState {
    showPurchased: boolean;
}

interface ManageAccessSceneState {
    users: { id: string, isOwner: boolean }[];
}

export class CategoryScene {
    constructor(private shoppingService: IShoppingServiceAdapter) {}

    getCategoryScene(): Scenes.BaseScene<BotContext> {
        const scene = new Scenes.BaseScene<BotContext>(CATEGORY_SCENE_ID);

        // Обработчик входа в сцену
        scene.enter(async (ctx) => {
            try {
                const state = ctx.scene.state as CategorySceneState;
                state.showPurchased = false;
                
                const currentCategoryId = ctx.session.currentCategoryId;
                if (!currentCategoryId) {
                    logger.error('ID категории не найден в сессии');
                    await ctx.reply('❌ Категория не найдена');
                    void ctx.scene.enter(CATEGORY_SCENE_ID);
                    return;
                }
                
                // Синхронизируем общие списки перед отображением
                try {
                    // Проверяем, является ли категория общей
                    const categories = ctx.session.categories as CategoryDto[];
                    const currentCategory = categories.find(cat => cat.id === currentCategoryId);
                    
                    if (currentCategory && currentCategory.name.includes('(общий)')) {
                        await ctx.reply('🔄 Синхронизация списка...');
                        await this.shoppingService.syncSharedListItems(ctx.session.userId, currentCategoryId);
                        
                        // Обновляем список элементов после синхронизации
                        ctx.session.items = await this.shoppingService.getItems(ctx.session.userId);
                    }
                } catch (syncError) {
                    logger.error('Ошибка при синхронизации общего списка:', syncError);
                    // Продолжаем, даже если синхронизация не удалась
                }
                
                await this.showCategoryMenu(ctx);
            } catch (error) {
                logger.error('Ошибка при входе в сцену категории:', error);
                await ctx.reply('❌ Произошла ошибка при загрузке категории. Пожалуйста, попробуйте позже.');
                void ctx.scene.enter(CATEGORY_SCENE_ID);
            }
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
        
        // Обработчик информации о товаре
        scene.action(/item_info_(.+)/, async (ctx) => {
            const itemId = ctx.match[1];
            logger.debug('Запрос информации о товаре', { itemId });
            await this.handleItemInfoClick(ctx, itemId);
        });
        
        // Обработчик toggle элемента (отметка о покупке)
        scene.action(/toggle_item_(.+)/, async (ctx) => {
            try {
                const itemId = ctx.match[1];
                logger.debug('Переключение статуса элемента', { itemId });
                await ctx.answerCbQuery();
                
                // Находим элемент в списке
                const itemIndex = (ctx.session.items as ShoppingListItemDto[])
                    .findIndex((item) => item.id === itemId);

                if (itemIndex !== -1) {
                    const item = ctx.session.items[itemIndex];
                    
                    // Если элемент отмечен как купленный, возвращаем его в список некупленных
                    if (item.purchased) {
                        // Возвращаем товар в некупленные с тем же количеством
                        await this.shoppingService.markItemAsNotPurchased(ctx.session.userId, itemId);
                        ctx.session.items = await this.shoppingService.getItems(ctx.session.userId);
                    } else {
                        // Уменьшаем количество в некупленном товаре
                        if (item.quantity > 1) {
                            await this.shoppingService.updateItemQuantity(
                                ctx.session.userId,
                                itemId,
                                item.quantity - 1
                            );
                            
                            // Отмечаем текущий товар как купленный
                            await this.shoppingService.markItemAsPurchased(ctx.session.userId, itemId);
                        } else {
                            // Если количество равно 1, просто отмечаем как купленный
                            await this.shoppingService.markItemAsPurchased(ctx.session.userId, itemId);
                        }
                        
                        ctx.session.items = await this.shoppingService.getItems(ctx.session.userId);
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
                const itemIndex = (ctx.session.items as ShoppingListItemDto[])
                    .findIndex((item) => item.id === itemId);

                if (itemIndex !== -1) {
                    const item = ctx.session.items[itemIndex];
                    
                    // Удаляем элемент из базы данных
                    await this.shoppingService.removeItem(ctx.session.userId, itemId);
                    
                    // Обновляем список элементов в сессии
                    ctx.session.items = await this.shoppingService.getItems(ctx.session.userId);
                    
                    await ctx.reply(`✅ Элемент "${item.name}" удален`);
                    
                    // Обновляем отображение меню категории
                    await this.showCategoryMenu(ctx);
                } else {
                    await ctx.reply('❌ Элемент не найден');
                }
            } catch (error) {
                logger.error('Ошибка при удалении элемента:', error);
                await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
            }
        });

        // Обработчик текстовых сообщений
        scene.on('text', async (ctx) => {
            // Если ожидаем ввода нового элемента
            if (ctx.session.waitingForItemInput) {
                try {
                    const input = ctx.message.text.trim();
                    
                    // Проверяем валидность ввода
                    if (!input) {
                        await ctx.reply('❌ Пожалуйста, введите название элемента');
                        return;
                    }

                    // Парсим введенные данные
                    const [name, quantityStr] = input.split(',').map(s => s.trim());
                    
                    // Проверяем наличие всех необходимых данных
                    if (!name || !quantityStr) {
                        await ctx.reply('❌ Пожалуйста, введите название и количество через запятую (например: Молоко, 2, л)');
                        return;
                    }
                    
                    // Проверяем корректность количества
                    const quantity = parseFloat(quantityStr);
                    if (isNaN(quantity) || quantity <= 0) {
                        await ctx.reply('❌ Пожалуйста, введите корректное количество (например: Молоко, 2, л)');
                        return;
                    }
                    
                    const currentCategoryId = ctx.session.currentCategoryId;
                    
                    // Добавляем новый элемент
                    await this.shoppingService.addItem(
                        ctx.session.userId,
                        currentCategoryId as string,
                        name,
                        quantity
                    );
                    
                    // Обновляем список элементов
                    ctx.session.items = await this.shoppingService.getItems(ctx.session.userId);
                    
                    await ctx.reply(`✅ Элемент "${name}" (${quantity}) добавлен`);
                    
                    // Сбрасываем флаг ожидания ввода
                    ctx.session.waitingForItemInput = false;
                    
                    // Показываем обновленное меню категории
                    await this.showCategoryMenu(ctx);
                } catch (error) {
                    logger.error('Ошибка при добавлении элемента:', error);
                    await ctx.reply('❌ Не удалось добавить элемент. Пожалуйста, попробуйте позже.');
                }
            }
        });

        // Обработчик кнопки "Поделиться списком"
        scene.action('share_list', async (ctx) => {
            try {
                logger.debug('Выбрано действие "Поделиться списком"');
                await ctx.answerCbQuery();
                
                const currentCategoryId = ctx.session.currentCategoryId;
                
                // Генерируем случайный код доступа (8 символов)
                const shareCode = Math.random().toString(36).substring(2, 10).toUpperCase();
                
                // Сохраняем код доступа в базе данных
                await this.shoppingService.createShareCode(ctx.session.userId, currentCategoryId as string, shareCode);
                
                // Отправляем сообщение с кодом доступа
                await ctx.reply(
                    `🔗 Код для доступа к списку создан!\n\n` +
                    `Поделитесь этим кодом с друзьями: <code>${shareCode}</code>\n\n` +
                    `Для доступа к списку, им нужно нажать на кнопку "Присоединиться к списку" в главном меню и ввести этот код.`,
                    {
                        parse_mode: 'HTML',
                        ...Markup.inlineKeyboard([
                            [Markup.button.callback('◀️ Назад', 'back_to_category')]
                        ])
                    }
                );
            } catch (error) {
                logger.error('Ошибка при создании кода доступа:', error);
                await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
            }
        });

        // Обработчик кнопки управления доступом
        scene.action('manage_access', async (ctx) => {
            logger.debug('Выбрано управление доступом');
            await ctx.answerCbQuery();
            return ctx.scene.enter(MANAGE_ACCESS_SCENE_ID);
        });

        return scene;
    }

    getShowPurchasedScene(): Scenes.BaseScene<BotContext> {
        const scene = new Scenes.BaseScene<BotContext>(SHOW_PURCHASED_SCENE_ID);

        // Обработчик входа в сцену
        scene.enter(async (ctx) => {
            logger.debug('Вход в сцену отображения купленных элементов');
            await this.showPurchasedItems(ctx);
        });

        // Обработчик кнопки "Назад"
        scene.action('back_to_category', async (ctx) => {
            logger.debug('Возврат к категории');
            await ctx.answerCbQuery();
            await ctx.scene.enter(CATEGORY_SCENE_ID);
        });

        return scene;
    }

    getManageAccessScene(): Scenes.BaseScene<BotContext> {
        const scene = new Scenes.BaseScene<BotContext>(MANAGE_ACCESS_SCENE_ID);
        
        // Обработчик входа в сцену
        scene.enter(async (ctx) => {
            try {
                const currentCategoryId = ctx.session.currentCategoryId;
                if (!currentCategoryId) {
                    logger.error('ID категории не найден в сессии');
                    await ctx.reply('❌ Категория не найдена');
                    void ctx.scene.enter(CATEGORY_SCENE_ID);
                    return;
                }
                
                // Получаем категорию для проверки
                const categories = ctx.session.categories as CategoryDto[];
                const currentCategory = categories.find(cat => cat.id === currentCategoryId);
                
                if (!currentCategory) {
                    logger.error('Категория не найдена в сессии', { categoryId: currentCategoryId });
                    await ctx.reply('❌ Категория не найдена');
                    void ctx.scene.enter(CATEGORY_SCENE_ID);
                    return;
                }
                
                // Проверяем, является ли пользователь владельцем
                if (currentCategory.userId !== ctx.session.userId) {
                    await ctx.reply('❌ Только владелец может управлять доступом к списку');
                    void ctx.scene.enter(CATEGORY_SCENE_ID);
                    return;
                }
                
                // Инициализируем состояние
                const state = ctx.scene.state as ManageAccessSceneState;
                
                // Получаем список пользователей с доступом
                state.users = await this.shoppingService.getUsersWithAccess(
                    ctx.session.userId, 
                    currentCategoryId
                );
                
                await this.showAccessManagementMenu(ctx, state);
            } catch (error) {
                logger.error('Ошибка при входе в сцену управления доступом:', error);
                await ctx.reply('❌ Произошла ошибка при загрузке управления доступом. Пожалуйста, попробуйте позже.');
                void ctx.scene.enter(CATEGORY_SCENE_ID);
            }
        });
        
        // Обработчик отзыва доступа
        scene.action(/revoke_access_(.+)/, async (ctx) => {
            try {
                const targetUserId = ctx.match[1];
                const currentCategoryId = ctx.session.currentCategoryId;
                
                if (!currentCategoryId) {
                    await ctx.answerCbQuery('Ошибка: категория не найдена');
                    void ctx.scene.enter(CATEGORY_SCENE_ID);
                    return;
                }
                
                logger.debug('Отзыв доступа у пользователя', { targetUserId, categoryId: currentCategoryId });
                
                // Отзываем доступ
                await this.shoppingService.revokeListAccess(
                    ctx.session.userId,
                    currentCategoryId,
                    targetUserId
                );
                
                await ctx.answerCbQuery('✅ Доступ успешно отозван');
                
                // Обновляем список пользователей
                const state = ctx.scene.state as ManageAccessSceneState;
                state.users = await this.shoppingService.getUsersWithAccess(
                    ctx.session.userId, 
                    currentCategoryId
                );
                
                await this.showAccessManagementMenu(ctx, state);
            } catch (error) {
                logger.error('Ошибка при отзыве доступа:', error);
                await ctx.answerCbQuery('❌ Произошла ошибка при отзыве доступа');
            }
        });
        
        // Обработчик кнопки создания кода доступа
        scene.action('share_list', async (ctx) => {
            try {
                const currentCategoryId = ctx.session.currentCategoryId;
                
                if (!currentCategoryId) {
                    await ctx.answerCbQuery('Ошибка: категория не найдена');
                    void ctx.scene.enter(CATEGORY_SCENE_ID);
                    return;
                }
                
                // Генерируем случайный код из 8 символов
                const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                let shareCode = '';
                for (let i = 0; i < 8; i++) {
                    shareCode += characters.charAt(Math.floor(Math.random() * characters.length));
                }
                
                // Сохраняем код для категории
                await this.shoppingService.createShareCode(ctx.session.userId, currentCategoryId, shareCode);
                
                await ctx.answerCbQuery();
                
                // Отправляем сообщение с кодом
                await ctx.reply(
                    `🔑 <b>Код доступа к списку:</b> <code>${shareCode}</code>\n\n` +
                    'Отправьте этот код другу, чтобы он мог присоединиться к вашему списку.',
                    { parse_mode: 'HTML' }
                );
                
                // Возвращаемся к меню управления доступом
                const state = ctx.scene.state as ManageAccessSceneState;
                await this.showAccessManagementMenu(ctx, state);
            } catch (error) {
                logger.error('Ошибка при создании кода доступа:', error);
                await ctx.answerCbQuery('❌ Произошла ошибка при создании кода доступа');
            }
        });
        
        // Обработчик кнопки назад
        scene.action('back_to_category', async (ctx) => {
            logger.debug('Возврат в меню категории');
            await ctx.answerCbQuery();
            void ctx.scene.enter(CATEGORY_SCENE_ID);
        });
        
        return scene;
    }

    private async showCategoryMenu(ctx: BotContext): Promise<void> {
        try {
            const state = ctx.scene.state as CategorySceneState;
            const currentCategoryId = ctx.session.currentCategoryId;
            
            if (!currentCategoryId) {
                logger.error('ID категории не найден в сессии');
                await ctx.reply('❌ Категория не найдена');
                await ctx.scene.enter(MAIN_MENU_SCENE_ID);
                return;
            }
            
            // Получаем категорию и элементы
            const categories = ctx.session.categories as CategoryDto[];
            const currentCategory = categories.find(cat => cat.id === currentCategoryId);
            const allItems = ctx.session.items as ShoppingListItemDto[];
            
            if (!currentCategory) {
                logger.error('Категория не найдена в сессии', { categoryId: currentCategoryId });
                await ctx.reply('❌ Категория не найдена');
                await ctx.scene.enter(MAIN_MENU_SCENE_ID);
                return;
            }
            
            // Фильтруем элементы текущей категории
            const items = allItems.filter(item => item.categoryId === currentCategoryId);
            
            // Фильтруем купленные/некупленные элементы в зависимости от состояния
            const filteredItems = state.showPurchased 
                ? items.filter(item => item.purchased)
                : items.filter(item => !item.purchased);
            
            // Определяем, является ли пользователь владельцем категории
            const isOwner = currentCategory.userId === ctx.session.userId;
            
            // Формируем список элементов
            let messageText = `📋 <b>${currentCategory.name}</b>\n\n`;
            
            if (filteredItems.length === 0) {
                messageText += state.showPurchased 
                    ? '😕 Нет купленных товаров' 
                    : '🛒 Список пуст. Добавьте товары!';
            } else {
                if (state.showPurchased) {
                    messageText += '✅ <b>Купленные товары:</b>\n\n';
                }
            }
            
            // Считаем количество купленных и общих товаров
            const purchasedCount = items.filter(item => item.purchased).length;
            const totalCount = items.length;
            
            // Добавляем статистику
            messageText += `\n📊 Куплено: ${purchasedCount}/${totalCount}`;
            
            // Формируем кнопки управления категорией
            const keyboard = [];
            
            // Добавляем кнопки для каждого товара
            if (filteredItems.length > 0) {
                filteredItems.forEach((item) => {
                    const emoji = item.purchased ? '✅' : '⬜';
                    const buttonText = `${emoji} ${item.name}${item.quantity > 1 ? ` (${item.quantity})` : ''}`;
                    
                    keyboard.push([
                        Markup.button.callback(buttonText, `toggle_item_${item.id}`),
                        Markup.button.callback('ℹ️', `item_info_${item.id}`),
                        Markup.button.callback('🗑️', `delete_item_${item.id}`)
                    ]);
                });
            }
            
            // Кнопка добавления товара
            keyboard.push([
                Markup.button.callback('🛒 Добавить товар', 'add_item')
            ]);
            
            // Кнопки переключения между купленными и некупленными товарами
            const toggleButtonText = state.showPurchased 
                ? '📋 Показать некупленные' 
                : '✅ Показать купленные';
            
            keyboard.push([
                Markup.button.callback(toggleButtonText, 'toggle_purchased')
            ]);
            
            // Если пользователь является владельцем категории, добавляем кнопку "Поделиться списком"
            if (isOwner) {
                keyboard.push([
                    Markup.button.callback('🔗 Поделиться списком', 'share_list'),
                    Markup.button.callback('👥 Управление доступом', 'manage_access')
                ]);
            }
            
            // Кнопка возврата в главное меню
            keyboard.push([
                Markup.button.callback('◀️ Назад в меню', 'back_to_main')
            ]);
            
            // Отправляем сообщение с кнопками
            await ctx.reply(messageText, {
                parse_mode: 'HTML',
                ...Markup.inlineKeyboard(keyboard)
            });
            
        } catch (error) {
            logger.error('Ошибка при отображении меню категории:', error);
            await ctx.reply('❌ Произошла ошибка при загрузке меню категории. Пожалуйста, попробуйте позже.');
            await ctx.scene.enter(MAIN_MENU_SCENE_ID);
        }
    }

    private async handleItemInfoClick(ctx: BotContext, itemId: string): Promise<void> {
        try {
            const item = (ctx.session.items as ShoppingListItemDto[])
                .find(item => item.id === itemId);
            
            if (!item) {
                await ctx.reply('❌ Элемент не найден');
                return;
            }
            
            const message = `ℹ️ Информация о товаре:\n\n` +
                `Название: ${item.name}\n` +
                `Количество: ${item.quantity}\n` +
                `Статус: ${item.purchased ? '✅ Куплен' : '⬜️ Не куплен'}\n` +
                `Дата добавления: ${new Date(item.createdAt).toLocaleDateString()}`;
            
            await ctx.reply(message, Markup.inlineKeyboard([
                [Markup.button.callback('◀️ Назад', 'back_to_category')]
            ]));
        } catch (error) {
            logger.error('Ошибка при отображении информации о товаре:', error);
            await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
        }
    }

    private async showAddItemForm(ctx: BotContext): Promise<void> {
        try {
            await ctx.reply(
                'Введите название, количество и единицу измерения через запятую (например: Молоко, 1.5, л) ⤵',
                Markup.inlineKeyboard([
                    [Markup.button.callback('◀️ Отмена', 'back_to_category')]
                ])
            );
        } catch (error) {
            logger.error('Ошибка при отображении формы добавления элемента:', error);
            await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
        }
    }

    private async showPurchasedItems(ctx: BotContext): Promise<void> {
        try {
            const currentCategoryId = ctx.session.currentCategoryId;
            const items = ctx.session.items as ShoppingListItemDto[];
            const purchasedItems = items.filter(item => 
                item.categoryId === currentCategoryId && item.purchased
            );
            
            if (purchasedItems.length === 0) {
                await ctx.reply(
                    'В этой категории нет купленных элементов',
                    Markup.inlineKeyboard([
                        [Markup.button.callback('◀️ Назад', 'back_to_category')]
                    ])
                );
                return;
            }
            
            const message = '✅ Купленные элементы:\n\n' +
                this.formatItemsList(purchasedItems);
            
            await ctx.reply(
                message,
                Markup.inlineKeyboard([
                    [Markup.button.callback('◀️ Назад', 'back_to_category')]
                ])
            );
        } catch (error) {
            logger.error('Ошибка при отображении купленных элементов:', error);
            await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
        }
    }

    private formatItemsList(items: ShoppingListItemDto[]): string {
        if (items.length === 0) {
            return 'Список пуст';
        }
        
        return items.map(item => 
            `${item.purchased ? '✅' : '⬜️'} ${item.name} (${item.quantity})`
        ).join('\n');
    }

    private async showAccessManagementMenu(ctx: BotContext, state: ManageAccessSceneState): Promise<void> {
        try {
            const categories = ctx.session.categories as CategoryDto[];
            const currentCategory = categories.find(cat => cat.id === ctx.session.currentCategoryId);
            
            if (!currentCategory) {
                await ctx.reply('❌ Категория не найдена');
                await ctx.scene.enter(CATEGORY_SCENE_ID);
                return;
            }
            
            // Формируем сообщение
            let messageText = `👥 <b>Управление доступом к списку "${currentCategory.name}"</b>\n\n`;
            
            if (state.users.length <= 1) {
                messageText += 'К списку пока никто не имеет доступа кроме вас.\n';
                messageText += 'Для добавления пользователей поделитесь кодом доступа.';
            } else {
                messageText += '<b>Пользователи с доступом:</b>\n\n';
                
                state.users.forEach(user => {
                    if (user.isOwner) {
                        messageText += `👑 ${user.id} (владелец)\n`;
                    } else {
                        messageText += `👤 ${user.id}\n`;
                    }
                });
                
                messageText += '\nЧтобы отозвать доступ, нажмите на кнопку рядом с пользователем.';
            }
            
            // Формируем кнопки
            const keyboard = [];
            
            // Кнопки для отзыва доступа у пользователей (кроме владельца)
            state.users.forEach(user => {
                if (!user.isOwner) {
                    keyboard.push([
                        Markup.button.callback(`❌ Отозвать доступ у ${user.id}`, `revoke_access_${user.id}`)
                    ]);
                }
            });
            
            // Кнопка для создания кода доступа
            keyboard.push([
                Markup.button.callback('🔗 Создать код доступа', 'share_list')
            ]);
            
            // Кнопка возврата
            keyboard.push([
                Markup.button.callback('◀️ Назад к списку', 'back_to_category')
            ]);
            
            // Отправляем сообщение
            await ctx.reply(messageText, {
                parse_mode: 'HTML',
                ...Markup.inlineKeyboard(keyboard)
            });
        } catch (error) {
            logger.error('Ошибка при отображении меню управления доступом:', error);
            await ctx.reply('❌ Произошла ошибка при загрузке меню управления доступом. Пожалуйста, попробуйте позже.');
            await ctx.scene.enter(CATEGORY_SCENE_ID);
        }
    }
} 