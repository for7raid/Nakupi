require("dotenv").config();
import { DataSource } from "typeorm";
import { CategoryModel } from "./models/CategoryModel";
import { UserModel } from "./models/UserModel";
import { ItemModel } from "./models/ItemModel";
import fs from "fs";

let db: DataSource;
export async function connectToDatabase(): Promise<DataSource> {
    if (db) {
        return db; // Reuse existing connection
    }

    const dbType = process.env.DB_TYPE;
    switch (dbType) {
        case "mysql":
            db = new DataSource({
                type: "mysql",
                host: process.env.DB_HOST,
                port: process.env.DB_PORT
                    ? parseInt(process.env.DB_PORT)
                    : 3306,
                username: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
                entities: [__dirname + "./../../domain/entities/*.{ts,js}"],
                migrations: [__dirname + "/migrations/*.{ts,js}"],
                migrationsRun: true,
                connectTimeout: 30000*2
            });
            break;

        case "mongo":
            db = new DataSource({
                type: "mongodb",
                host: process.env.DB_HOST,
                port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 27017,
                username: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
                entities: [CategoryModel, UserModel, ItemModel],
                useUnifiedTopology: true,
                useNewUrlParser: true,
                synchronize: true,
                logging: true,
            });
            break;

        default:
            throw new Error(`Unsupported database type: ${dbType}`);
    }

    // Initialize the database connection asynchronously
    try {
        await db.initialize();
        console.log(`Connected to ${dbType} database!`);
        
        // Verify repositories are created
        if (dbType === "mongo") {
            const categoryRepo = db.getMongoRepository(CategoryModel);
            const userRepo = db.getMongoRepository(UserModel);
            const itemRepo = db.getMongoRepository(ItemModel);
            
            console.log("Repositories initialized:", {
                categoryRepo: !!categoryRepo,
                userRepo: !!userRepo,
                itemRepo: !!itemRepo
            });
        }
        
        return db;
    } catch (error) {
        console.error(`Error connecting to ${dbType} database:`, error);
        throw error;
    }
};
