import { Markup, Scenes } from 'telegraf';
import { BotContext } from '../types/session';
import { IShoppingServiceAdapter } from '../adapters/IShoppingServiceAdapter';
import logger from '../../../infrastructure/logging/Logger';
import metricsService from '../../../infrastructure/monitoring/FileMetricsService';
import { Category } from '../../../domain/entities/Category';
import { ShoppingListItem } from '../../../domain/entities/ShoppingListItem';
import { CategoryDto } from '../../../application/dto/CategoryDto';
import { ShoppingListItemDto } from '../../../application/dto/ShoppingListItemDto';

export const MAIN_MENU_SCENE_ID = 'MAIN_MENU_SCENE';
export const JOIN_LIST_SCENE_ID = 'JOIN_LIST_SCENE';

export class MainMenuScene {
    constructor(private shoppingService: IShoppingServiceAdapter) {}

    getScene(): Scenes.BaseScene<BotContext> {
        const scene = new Scenes.BaseScene<BotContext>(MAIN_MENU_SCENE_ID);

        // Обработчик входа в сцену
        scene.enter(async (ctx) => {
            logger.debug('Вход в сцену главного меню');
            
            try {
                await this.showMainMenu(ctx);
            } catch (error) {
                logger.error('Ошибка при отображении главного меню:', error);
                await ctx.reply('❌ Произошла ошибка при загрузке главного меню. Пожалуйста, попробуйте позже.');
            }
        });

        // Обработка команды /start внутри сцены
        scene.command('start', async (ctx) => {
            logger.debug('Получена команда /start внутри главного меню');
            await this.showMainMenu(ctx);
        });

        // Обработчик кнопки управления категориями
        scene.action('manage_categories', async (ctx) => {
            logger.debug('Выбрано управление категориями');
            await ctx.answerCbQuery();
            return ctx.scene.enter('MANAGE_CATEGORIES_SCENE');
        });
        
        // Обработчик кнопки присоединения к списку
        scene.action('join_list', async (ctx) => {
            logger.debug('Выбрано присоединение к списку');
            await ctx.answerCbQuery();
            return ctx.scene.enter(JOIN_LIST_SCENE_ID);
        });

        // Обработчик выбора категории
        scene.action(/select_category_(.+)/, async (ctx) => {
            try {
                const categoryId = ctx.match[1];
                logger.debug('Выбрана категория', { categoryId });
                
                // Сохраняем ID выбранной категории в сессии
                ctx.session.currentCategoryId = categoryId;
                
                await ctx.answerCbQuery();
                return ctx.scene.enter('CATEGORY_SCENE');
            } catch (error) {
                logger.error('Ошибка при выборе категории:', error);
                await ctx.answerCbQuery('Произошла ошибка');
                await ctx.reply('❌ Не удалось загрузить категорию. Пожалуйста, попробуйте позже.');
            }
        });

        return scene;
    }
    
    getJoinListScene(): Scenes.BaseScene<BotContext> {
        const scene = new Scenes.BaseScene<BotContext>(JOIN_LIST_SCENE_ID);
        
        // Обработчик входа в сцену
        scene.enter(async (ctx) => {
            logger.debug('Вход в сцену присоединения к списку');
            await ctx.reply(
                'Введите код доступа, который вам отправил друг ⤵',
                Markup.inlineKeyboard([
                    [Markup.button.callback('◀️ Назад', 'back_to_main')]
                ])
            );
        });
        
        // Обработчик кнопки "Назад"
        scene.action('back_to_main', async (ctx) => {
            logger.debug('Возврат в главное меню');
            await ctx.answerCbQuery();
            return ctx.scene.enter(MAIN_MENU_SCENE_ID);
        });
        
        // Обработчик текстовых сообщений (код доступа)
        scene.on('text', async (ctx) => {
            try {
                const shareCode = ctx.message.text.trim().toUpperCase();
                
                // Проверяем валидность кода (должен быть не пустым и длиной 8 символов)
                if (!shareCode || shareCode.length !== 8) {
                    await ctx.reply('❌ Неверный формат кода. Код должен состоять из 8 символов.');
                    return;
                }
                
                logger.debug('Получен код для присоединения к списку', { shareCode });
                
                // Присоединяемся к списку
                const category = await this.shoppingService.joinSharedList(ctx.session.userId, shareCode);
                
                // Обновляем категории и элементы в сессии
                ctx.session.categories = await this.shoppingService.getCategories(ctx.session.userId);
                ctx.session.items = await this.shoppingService.getItems(ctx.session.userId);
                
                await ctx.reply(`✅ Успешно присоединились к списку "${category.name}"!`);
                
                // Возвращаемся в главное меню
                return ctx.scene.enter(MAIN_MENU_SCENE_ID);
            } catch (error) {
                logger.error('Ошибка при присоединении к списку:', error);
                await ctx.reply('❌ Не удалось присоединиться к списку. Проверьте корректность кода и попробуйте снова.');
            }
        });
        
        return scene;
    }

    private async showMainMenu(ctx: BotContext): Promise<void> {
        try {
            const userId = ctx.from?.id.toString();
            if (!userId) {
                logger.warn('Не удалось получить ID пользователя при формировании главного меню');
                await ctx.reply('❌ Ошибка идентификации пользователя');
                return;
            }
            
            // Сохраняем userId в сессии для использования в других сценах
            ctx.session.userId = userId;
            
            // Получаем текущие категории пользователя
            logger.debug('Получение категорий для главного меню', { userId });
            const categories = await this.shoppingService.getCategories(userId);
            
            // Сохраняем категории в сессии
            ctx.session.categories = categories;
            
            // Получаем все элементы списков покупок
            const allItems = await this.shoppingService.getItems(userId);
            ctx.session.items = allItems;
            
            // Формируем кнопки категорий
            const categoryButtons = categories.map((category: CategoryDto) => {
                // Фильтруем элементы по текущей категории
                const itemsInCategory = allItems.filter((item: ShoppingListItemDto) => 
                    item.categoryId === category.id
                );
                
                // Подсчитываем купленные и общие элементы в категории
                const purchasedCount = itemsInCategory.filter((item) => item.purchased).length;
                const totalCount = itemsInCategory.length;
                
                return [Markup.button.callback(
                    `${category.name} (${purchasedCount}/${totalCount})`, 
                    `select_category_${category.id}`
                )];
            });
            
            // Отправляем меню с категориями и кнопками управления
            await ctx.reply(
                'Выберите список покупок или действие:',
                Markup.inlineKeyboard([
                    ...categoryButtons,
                    [Markup.button.callback('🗂️ Управление категориями', 'manage_categories')],
                    [Markup.button.callback('🔗 Присоединиться к списку', 'join_list')]
                ])
            );
            
            logger.debug('Главное меню отображено', { userId, categoriesCount: categories.length });
        } catch (error) {
            logger.error('Ошибка при формировании главного меню:', error);
            metricsService.incrementError();
            await ctx.reply('❌ Произошла ошибка при загрузке главного меню. Пожалуйста, попробуйте позже.');
        }
    }
}