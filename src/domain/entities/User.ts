// src/domain/entities/User.ts
import { UserId } from "../value-objects/UserId";

export class User {
  private constructor(
    private readonly _id: string,
    private readonly _telegramId: UserId,
    private readonly _username?: string
  ) {}

  get id(): string {
    return this._id;
  }

  get telegramId(): UserId {
    return this._telegramId;
  }

  get username(): string | undefined {
    return this._username;
  }

  public static create(telegramId: UserId, username?: string): User {
    return new User(
      new Date().getTime().toString(),
      telegramId,
      username
    );
  }

  public static reconstitute(id: string, telegramId: UserId, username?: string): User {
    return new User(id, telegramId, username);
  }
}