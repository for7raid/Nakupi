import "reflect-metadata";
import { initializeRepositories } from "./repositoryContainer";
import "./serviceContainer";
import "./controllerContainer";

export async function initializeContainer() {
    try {
        await initializeRepositories();
        console.log("Container initialized successfully");
    } catch (error) {
        console.error("Failed to initialize container:", error);
        throw error;
    }
}
