import { Entity, ObjectIdColumn, Column } from "typeorm";
import { ObjectId } from "mongodb";
import { User } from "../../../domain/entities/User";
import { UserId } from "../../../domain/value-objects/UserId";

@Entity("users")
export class UserModel {
    @ObjectIdColumn()
    id!: ObjectId;

    @Column()
    telegramId!: string;

    @Column({ nullable: true })
    username?: string;

    @Column({ name: "registrationDate", type: "date", nullable: true })
    createdAt?: Date;

    @Column({ name: "lastActionDate", type: "date", nullable: true })
    updatedAt?: Date;

    static fromDomain(user: User): UserModel {
        const model = new UserModel();
        model.id = new ObjectId(user.id);
        model.telegramId = user.telegramId.toString();
        model.username = user.username;
        model.createdAt = new Date();
        model.updatedAt = new Date();
        return model;
    }

    static fromPartial(data: { telegramId: string; username?: string }): UserModel {
        const model = new UserModel();
        model.telegramId = data.telegramId;
        model.username = data.username;
        model.createdAt = new Date();
        model.updatedAt = new Date();
        return model;
    }

    toDomain(): User {
        return User.reconstitute(
            this.id.toString(),
            UserId.from(this.telegramId),
            this.username
        );
    }
}
