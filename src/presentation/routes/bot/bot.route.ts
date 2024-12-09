import { BotController } from "../../controllers/Bot.Controller";
import express from "express";
import { container } from "tsyringe";

const router = express.Router();

/************************container**************************/
const botController = container.resolve(BotController);

/************************ routes ***************************/
router.post(
  "/start",
  botController.start.bind(botController)
);

export default router;
