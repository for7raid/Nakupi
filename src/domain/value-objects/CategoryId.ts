import { ObjectId } from "mongodb";

export class CategoryId {
  private readonly value: ObjectId;

  private constructor(value: ObjectId) {
    this.value = value;
  }

  public static create(): CategoryId {
    return new CategoryId(new ObjectId());
  }

  public static from(value: string | ObjectId): CategoryId {
    if (typeof value === 'string') {
      return new CategoryId(new ObjectId(value));
    }
    return new CategoryId(value);
  }

  public toString(): string {
    return this.value.toString();
  }

  public equals(other: CategoryId): boolean {
    return this.value.equals(other.value);
  }
}
