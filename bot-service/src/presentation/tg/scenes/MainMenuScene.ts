import { Markup, Scenes } from 'telegraf';
import { BotContext } from '../types/session';
import { ShoppingService } from '../../../application/services/ShoppingService';
import logger from '../../../infrastructure/logging/Logger';
import metricsService from '../../../infrastructure/monitoring/FileMetricsService';

export const MAIN_MENU_SCENE_ID = 'MAIN_MENU_SCENE';

export class MainMenuScene {
    constructor(private shoppingService: ShoppingService) {}

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

    private async showMainMenu(ctx: BotContext): Promise<void> {
        try {
            const userId = ctx.from?.id.toString();
            if (!userId) {
                logger.warn('Не удалось получить ID пользователя при формировании главного меню');
                await ctx.reply('❌ Ошибка идентификации пользователя');
                return;
            }
            
            // Получаем текущие категории пользователя
            logger.debug('Получение категорий для главного меню', { userId });
            const categories = await this.shoppingService.getCategories(userId);
            
            // Сохраняем категории в сессии
            ctx.session.categories = categories;
            
            // Получаем все элементы списков покупок
            const allItems = await this.shoppingService.getItems(userId);
            ctx.session.items = allItems;
            
            // Формируем кнопки категорий
            const categoryButtons = categories.map(category => {
                // Фильтруем элементы по текущей категории
                const itemsInCategory = allItems.filter(item => item.categoryId === category.id);
                // Подсчитываем купленные и общие элементы в категории
                const purchasedCount = itemsInCategory.filter(item => item.purchased).length;
                const totalCount = itemsInCategory.length;
                
                return [Markup.button.callback(
                    `${category.name} (${purchasedCount}/${totalCount})`, 
                    `select_category_${category.id}`
                )];
            });
            
            // Отправляем меню с категориями и кнопкой управления
            await ctx.reply(
                'Выберите список покупок или действие:',
                Markup.inlineKeyboard([
                    ...categoryButtons,
                    [Markup.button.callback('🗂️ Управление категориями', 'manage_categories')]
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