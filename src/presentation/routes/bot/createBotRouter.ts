import { BotController } from "../../controllers/Bot.Controller";
import express, { Router } from "express";
import { container } from "tsyringe";

export function createBotRouter(): Router {
    const router = express.Router();
    const botController = container.resolve(BotController);

    router.post(
        "/start",
        botController.start.bind(botController)
    );

    return router;
}
