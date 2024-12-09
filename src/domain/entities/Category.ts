// src/domain/entities/Category.ts
import {
  Entity,
  ObjectIdColumn,
  Column,
} from "typeorm";
import { CategoryId } from "../value-objects/CategoryId";
import { UserId } from "../value-objects/UserId";
import { DomainError } from "../errors/DomainError";

@Entity("categories")
export class Category {

  @ObjectIdColumn()
  private _id: CategoryId;

  @Column({ name: "name", type: "varchar", length: 255, nullable: false })
  private _name: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  private _userId: UserId;

  private constructor(id: CategoryId, name: string, userId: UserId) {
    this._id = id;
    this._name = name;
    this._userId = userId;
  }

  public static create(name: string, userId: UserId): Category {
    if (!name || name.trim().length === 0) {
      throw new DomainError("Category name cannot be empty");
    }
    
    return new Category(CategoryId.create(), name.trim(), userId);
  }

  public static reconstitute(id: string | CategoryId, name: string, userId: string | UserId): Category {
    const categoryId = typeof id === 'string' ? CategoryId.from(id) : id;
    const userIdObj = typeof userId === 'string' ? UserId.from(userId) : userId;
    
    return new Category(categoryId, name, userIdObj);
  }

  // Getters
  public get id(): CategoryId {
    return this._id;
  }

  public get name(): string {
    return this._name;
  }

  public get userId(): UserId {
    return this._userId;
  }

  // Domain Methods
  public rename(newName: string): void {
    if (!newName || newName.trim().length === 0) {
      throw new DomainError("Category name cannot be empty");
    }
    this._name = newName.trim();
  }

  public belongsToUser(userId: UserId): boolean {
    return this._userId.equals(userId);
  }

  // For ORM
  public toJSON() {
    return {
      id: this._id.toString(),
      name: this._name,
      userId: this._userId.toString()
    };
  }
}