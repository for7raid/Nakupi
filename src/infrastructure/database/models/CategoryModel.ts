import { Entity, ObjectIdColumn, Column } from "typeorm";
import { ObjectId } from "mongodb";
import { Category } from "../../../domain/entities/Category";
import { CategoryId } from "../../../domain/value-objects/CategoryId";
import { UserId } from "../../../domain/value-objects/UserId";

@Entity("categories")
export class CategoryModel {
    @ObjectIdColumn()
    _id!: ObjectId;

    @Column()
    name!: string;

    @Column()
    userId!: string;

    static fromDomain(category: Category): CategoryModel {
        const model = new CategoryModel();
        model._id = new ObjectId(category.id.toString());
        model.name = category.name;
        model.userId = category.userId.toString();
        return model;
    }

    toDomain(): Category {
        return Category.reconstitute(
            this._id.toString(),
            this.name,
            this.userId
        );
    }
}
