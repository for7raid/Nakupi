export class UserId {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  public static from(value: string | number): UserId {
    return new UserId(value.toString());
  }

  public toString(): string {
    return this.value;
  }

  public equals(other: UserId): boolean {
    return this.value === other.value;
  }
}
