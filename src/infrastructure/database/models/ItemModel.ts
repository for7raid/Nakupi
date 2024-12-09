import { Entity, ObjectIdColumn, Column } from "typeorm";
import { ObjectId } from "mongodb";
import { Item } from "../../../domain/entities/Item";
import { CategoryId } from "../../../domain/value-objects/CategoryId";
import { UserId } from "../../../domain/value-objects/UserId";

@Entity("items")
export class ItemModel {
    @ObjectIdColumn()
    id!: ObjectId;

    @Column()
    name!: string;

    @Column()
    categoryId!: string;

    @Column()
    userId!: string;

    @Column()
    isCompleted!: boolean;

    static fromDomain(item: Item): ItemModel {
        const model = new ItemModel();
        model.id = new ObjectId(item.id);
        model.name = item.name;
        model.categoryId = item.categoryId.toString();
        model.userId = item.userId.toString();
        model.isCompleted = item.isCompleted;
        return model;
    }

    toDomain(): Item {
        return Item.reconstitute(
            this.id.toString(),
            this.name,
            CategoryId.from(this.categoryId),
            UserId.from(this.userId),
            this.isCompleted
        );
    }
}
