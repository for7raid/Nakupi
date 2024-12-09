import "reflect-metadata";
import express, { Application, urlencoded, json } from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import { initializeContainer } from "./presentation/containers";
import { createRoutes } from "./presentation/routes";
import errorHandler from "./presentation/middlewares/handlers/error.handler";

export async function createApp(): Promise<Application> {
    // Initialize container first
    await initializeContainer();

    const app: Application = express();

    const corsOptions = {
        origin: "*",
        credentials: true,
        optionSuccessStatus: 200,
    };

    // Middleware
    app.use(helmet());          
    app.use(cors(corsOptions));
    app.use(json({ limit: "5mb" }));
    app.use(urlencoded({ extended: false }));
    app.use(morgan("dev"));

    // Initialize and use routes after container is ready
    const routes = createRoutes();
    app.use(routes);

    //error handler middleware
    app.use(errorHandler);

    return app;
}
