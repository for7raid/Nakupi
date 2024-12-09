import { container } from "tsyringe";
import { BotController } from "../controllers/Bot.Controller";

// Register controllers

/************************** Bot *******************************/
container.registerSingleton(BotController);

export { container as controllerContainer };
