import { inject, injectable } from "tsyringe";
import { User } from "../../../domain/entities/User";
import { UserId } from "../../../domain/value-objects/UserId";
import { IUserRepository } from "../../../domain/interfaces/repositories/IUserRepository";

@injectable()
export class UserService {
  constructor(
    @inject("IUserRepository")
    private userRepository: IUserRepository
  ) {}

  async createUser(telegramId: string, username: string): Promise<User> {
    const existingUser = await this.userRepository.findByTelegramId(telegramId);
    if (existingUser) return existingUser;

    const user = User.create(UserId.from(telegramId), username);
    await this.userRepository.save(user);
    return user;
  }

  async getUserByTelegramId(telegramId: string): Promise<User | null> {
    return await this.userRepository.findByTelegramId(telegramId);
  }

  async updateUser(user: User): Promise<User> {
    await this.userRepository.save(user);
    return user;
  }

}
