import { Markup, Scenes } from 'telegraf';
import { BotContext } from '../types/session';
import { IShoppingServiceAdapter } from '../adapters/IShoppingServiceAdapter';
import logger from '../../../infrastructure/logging/Logger';
import metricsService from '../../../infrastructure/monitoring/FileMetricsService';
import { CategoryDto } from '../../../application/dto/CategoryDto';
import { MAIN_MENU_SCENE_ID } from './MainMenuScene';

export const MANAGE_CATEGORIES_SCENE_ID = 'MANAGE_CATEGORIES_SCENE';
export const ADD_CATEGORY_SCENE_ID = 'ADD_CATEGORY_SCENE';

export class ManageCategoriesScene {
    constructor(private shoppingService: IShoppingServiceAdapter) {}

    getScene(): Scenes.BaseScene<BotContext> {
        const scene = new Scenes.BaseScene<BotContext>(MANAGE_CATEGORIES_SCENE_ID);

        // Обработчик входа в сцену
        scene.enter(async (ctx) => {
            logger.debug('Вход в сцену управления категориями');
            await this.showManageCategoriesMenu(ctx);
        });

        // Обработчик кнопки "Добавить категорию"
        scene.action('add_category', async (ctx) => {
            logger.debug('Выбрано добавление категории');
            await ctx.answerCbQuery();
            return ctx.scene.enter(ADD_CATEGORY_SCENE_ID);
        });

        // Обработчик кнопки "Удалить категорию"
        scene.action('remove_category', async (ctx) => {
            logger.debug('Выбрано удаление категории');
            await ctx.answerCbQuery();
            await this.showDeleteCategoryMenu(ctx);
        });

        // Обработчик удаления категории
        scene.action(/delete_category_(.+)/, async (ctx) => {
            try {
                const categoryId = ctx.match[1];
                logger.debug('Запрос на удаление категории', { categoryId });
                
                await this.shoppingService.removeCategory(ctx.session.userId, categoryId);
                metricsService.incrementRemoveCategory();
                
                await ctx.answerCbQuery('✅ Категория удалена');
                await ctx.reply('✅ Категория успешно удалена');
                
                // Обновляем список категорий
                ctx.session.categories = await this.shoppingService.getCategories(ctx.session.userId);
                
                await this.showManageCategoriesMenu(ctx);
            } catch (error) {
                logger.error('Ошибка при удалении категории:', error);
                metricsService.incrementError();
                await ctx.answerCbQuery('❌ Ошибка при удалении');
                await ctx.reply('❌ Не удалось удалить категорию. Пожалуйста, попробуйте позже.');
            }
        });

        // Обработчик кнопки "Назад"
        scene.action('back_to_main', async (ctx) => {
            logger.debug('Возврат в главное меню');
            await ctx.answerCbQuery();
            await ctx.scene.enter(MAIN_MENU_SCENE_ID);
        });

        return scene;
    }

    getAddCategoryScene(): Scenes.BaseScene<BotContext> {
        const scene = new Scenes.BaseScene<BotContext>(ADD_CATEGORY_SCENE_ID);

        // Обработчик входа в сцену
        scene.enter(async (ctx) => {
            logger.debug('Вход в сцену добавления категории');
            await ctx.reply(
                'Введите название новой категории ⤵',
                Markup.inlineKeyboard([
                    [Markup.button.callback('◀️ Назад', 'back_to_manage')]
                ])
            );
        });

        // Обработчик ввода текста (название категории)
        scene.on('text', async (ctx) => {
            try {
                const categoryName = ctx.message.text.trim();
                
                if (!categoryName) {
                    await ctx.reply('❌ Название категории не может быть пустым. Пожалуйста, введите название:');
                    return;
                }
                
                logger.debug('Создание новой категории', { categoryName, userId: ctx.session.userId });
                
                // Добавляем новую категорию
                await this.shoppingService.addCategory(ctx.session.userId, categoryName);
                metricsService.incrementAddCategory();
                
                await ctx.reply(`✅ Категория "${categoryName}" успешно добавлена`);
                
                // Обновляем список категорий в сессии
                ctx.session.categories = await this.shoppingService.getCategories(ctx.session.userId);
                
                // Возвращаемся в меню управления категориями
                await ctx.scene.enter(MANAGE_CATEGORIES_SCENE_ID);
            } catch (error) {
                logger.error('Ошибка при добавлении категории:', error);
                metricsService.incrementError();
                await ctx.reply('❌ Не удалось добавить категорию. Пожалуйста, попробуйте позже.');
            }
        });

        // Обработчик кнопки "Назад"
        scene.action('back_to_manage', async (ctx) => {
            logger.debug('Возврат в меню управления категориями');
            await ctx.answerCbQuery();
            await ctx.scene.enter(MANAGE_CATEGORIES_SCENE_ID);
        });

        return scene;
    }

    private async showManageCategoriesMenu(ctx: BotContext): Promise<void> {
        try {
            await ctx.reply(
                '🔧 Выберите действие с категориями:',
                Markup.inlineKeyboard([
                    [
                        Markup.button.callback('➕ Добавить категорию', 'add_category'),
                        Markup.button.callback('❌ Удалить категорию', 'remove_category')
                    ],
                    [
                        Markup.button.callback('◀️ Назад', 'back_to_main')
                    ]
                ])
            );
        } catch (error) {
            logger.error('Ошибка при отображении меню управления категориями:', error);
            await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
        }
    }

    private async showDeleteCategoryMenu(ctx: BotContext): Promise<void> {
        try {
            // Получаем или используем категории из сессии
            let categories = ctx.session.categories;
            if (!categories || categories.length === 0) {
                categories = await this.shoppingService.getCategories(ctx.session.userId);
                ctx.session.categories = categories;
            }
            
            if (categories.length === 0) {
                await ctx.reply('У вас нет созданных категорий');
                await ctx.scene.enter(MANAGE_CATEGORIES_SCENE_ID);
                return;
            }
            
            const categoryButtons = (categories as CategoryDto[]).map(cat => 
                [Markup.button.callback(cat.name, `delete_category_${cat.id}`)]
            );
            
            await ctx.reply(
                'Выберите категорию для удаления ⤵',
                Markup.inlineKeyboard([
                    ...categoryButtons,
                    [Markup.button.callback('◀️ Назад', 'back_to_manage')]
                ])
            );
        } catch (error) {
            logger.error('Ошибка при отображении меню удаления категории:', error);
            await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
            await ctx.scene.enter(MANAGE_CATEGORIES_SCENE_ID);
        }
    }
}