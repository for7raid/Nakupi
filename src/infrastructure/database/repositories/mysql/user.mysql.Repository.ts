import { User } from "../../../../domain/entities/User";
import { connectToDatabase } from "../../";
import { IUserRepository } from "../../../../domain/interfaces/repositories/IUserRepository";
import { DataSource, EntityManager } from "typeorm"; 

// export class UserMysqlRepository implements IUserRepository {
//   private client!: DataSource;
 
//   constructor() {
//     this.init();
//   }

//   private async init() {
//     this.client = await connectToDatabase();
//   }

//   async register(input: any, entityManager: EntityManager): Promise<User> {
//     const { username, telegramId } = input;
//     const record = entityManager.create(User, {
//       username,
//       telegramId,
//       registrationDate: new Date(),
//       lastAction: new Date()
//     });
//     const savedUser = await entityManager.save(record);
//     return savedUser;
//   }

// }
