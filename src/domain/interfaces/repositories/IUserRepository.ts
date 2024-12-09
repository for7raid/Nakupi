import { User } from "../../entities/User";
import { UserId } from "../../value-objects/UserId";

export interface IUserRepository {
  save(user: User): Promise<void>;
  findById(id: UserId): Promise<User | null>;
  findByTelegramId(telegramId: string): Promise<User | null>;
  delete(id: UserId): Promise<void>;
  exists(id: UserId): Promise<boolean>;
}
