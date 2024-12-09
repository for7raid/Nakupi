import "reflect-metadata";
import { config } from "dotenv";
config();

import { container } from "tsyringe";
import http from "http";
import { createApp } from "./app";
import configureSocket from "./configuration/socketConfig";
import { BotService } from "./application/services/bot/Bot.Service";

async function startServer() {
    try {
        // Create app with initialized container
        const app = await createApp();
        
        // Start bot
        const botService = container.resolve(BotService);
        await botService.init(process.env.BOT_TOKEN);

        const PORT = process.env.PORT || 3000;
        const server = http.createServer(app);
        const io = configureSocket(server);

        // Start server
        server.listen(PORT, () => {
            console.log(`Server is listening on port ${PORT}`);
        });

        // Handle uncaught exceptions
        process.on("uncaughtException", (error) => {
            console.error("Uncaught exception:", error);
            process.exit(1);
        });

        // Handle unhandled promise rejections
        process.on("unhandledRejection", (error) => {
            console.error("Unhandled rejection:", error);
            process.exit(1);
        });

        // Handle server errors
        server.on("error", (error: NodeJS.ErrnoException) => {
            console.error("Server error:", error);
            process.exit(1);
        });

        // Gracefully shut down server on SIGINT
        process.on("SIGINT", () => {
            console.log("Received SIGINT, shutting down gracefully");
            server.close(() => {
                console.log("Server closed");
                process.exit(0);
            });
        });

        // Gracefully shut down server on SIGTERM
        process.on("SIGTERM", () => {
            console.log("Received SIGTERM, shutting down gracefully");
            server.close(() => {
                console.log("Server closed");
                process.exit(0);
            });
        });
    } catch (error) {
        console.error("Error starting server:", error);
        process.exit(1);
    }
}

startServer();
