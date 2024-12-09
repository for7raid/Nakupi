import { CategoryId } from "../value-objects/CategoryId";
import { UserId } from "../value-objects/UserId";
import { DomainError } from "../errors/DomainError";

export class Item {
  private readonly _id: string;

  private readonly _categoryId: CategoryId;

  private readonly _userId: UserId;

  private _name: string;

  private _isCompleted: boolean;

  private constructor(
    id: string,
    name: string,
    categoryId: CategoryId,
    userId: UserId,
    isCompleted: boolean = false
  ) {
    this._id = id;
    this._name = name;
    this._categoryId = categoryId;
    this._userId = userId;
    this._isCompleted = isCompleted;
  }

  public static create(
    id: string,
    name: string,
    categoryId: CategoryId,
    userId: UserId,
    isCompleted: boolean = false
  ): Item {
    if (!name || name.trim().length === 0) {
      throw new DomainError("Item name cannot be empty");
    }
    return new Item(id, name.trim(), categoryId, userId, isCompleted);
  }

  public static reconstitute(
    id: string,
    name: string,
    categoryId: CategoryId,
    userId: UserId,
    isCompleted: boolean
  ): Item {
    return new Item(id, name, categoryId, userId, isCompleted);
  }

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get categoryId(): CategoryId {
    return this._categoryId;
  }

  get userId(): UserId {
    return this._userId;
  }

  get isCompleted(): boolean {
    return this._isCompleted;
  }

  public rename(newName: string): void {
    if (!newName || newName.trim().length === 0) {
      throw new DomainError("Item name cannot be empty");
    }
    this._name = newName.trim();
  }

  public toggleComplete(): void {
    this._isCompleted = !this._isCompleted;
  }

  public belongsToUser(userId: UserId): boolean {
    return this._userId.equals(userId);
  }

  public belongsToCategory(categoryId: CategoryId): boolean {
    return this._categoryId.equals(categoryId);
  }
}
