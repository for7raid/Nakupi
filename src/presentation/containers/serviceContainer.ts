import { container } from "tsyringe";
import { UserService } from "../../application/services/user/User.Service";
import { BotService } from "../../application/services/bot/Bot.Service";
import { CategoriesService } from "../../application/services/categories/Categories.Service";
import { ItemService } from "../../application/services/item/Item.Service";
import { IItemService } from "../../domain/interfaces/services/IItemService";
import { ICategoriesService } from "../../domain/interfaces/services/ICategoriesService";
import { IBotService } from "../../domain/interfaces/services/IBotService";
import { CategoryHandler } from "../../application/services/bot/handlers/CategoryHandler";
import { ItemHandler } from "../../application/services/bot/handlers/ItemHandler";

// Register handlers
container.registerSingleton(CategoryHandler);
container.registerSingleton(ItemHandler);

// Register services with their interfaces
container.registerSingleton<ICategoriesService>("ICategoriesService", CategoriesService);
container.registerSingleton<IItemService>("IItemService", ItemService);
container.registerSingleton<IBotService>("IBotService", BotService);
container.registerSingleton(UserService);

export { container as serviceContainer };
