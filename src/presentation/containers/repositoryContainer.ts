// src/container/repositoryContainer.ts
import { container } from "tsyringe";
import { DataSource } from "typeorm";
import { connectToDatabase } from "../../infrastructure/database";

import { MongoDBUserRepository } from "../../infrastructure/database/repositories/mongodb/user.mongo.Repository";
import { MongoDBCategoryRepository } from "../../infrastructure/database/repositories/mongodb/category.mongo.Repository";
import { MongoDBItemRepository } from "../../infrastructure/database/repositories/mongodb/item.mongo.Repository";

import { IUserRepository } from "../../domain/interfaces/repositories/IUserRepository";
import { ICategoriesRepository } from "../../domain/interfaces/repositories/ICategoriesRepository";
import { IItemsRepository } from "../../domain/interfaces/repositories/IItemsRepository";

// Initialize repositories after database connection
export async function initializeRepositories() {
    try {
        const dataSource = await connectToDatabase();
        
        // Register DataSource first
        container.register<DataSource>("DataSource", {
            useValue: dataSource
        });

        // Register repositories with their interfaces
        container.register<IUserRepository>("IUserRepository", {
            useFactory: () => new MongoDBUserRepository(dataSource)
        });
        
        container.register<ICategoriesRepository>("ICategoriesRepository", {
            useFactory: () => new MongoDBCategoryRepository(dataSource)
        });
        
        container.register<IItemsRepository>("IItemsRepository", {
            useFactory: () => new MongoDBItemRepository(dataSource)
        });

        return container;
    } catch (error) {
        console.error('Failed to initialize repositories:', error);
        throw error;
    }
}

export { container as repositoryContainer };
