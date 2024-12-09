import { Router } from "express";
import { createBotRouter } from "./bot/createBotRouter";

export function createRoutes(): Router {
    const router = Router();
    
    // Initialize routes
    router.use("/bot", createBotRouter());
    
    return router;
}
