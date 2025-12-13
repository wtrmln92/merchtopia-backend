import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity()
export class Product {
    @PrimaryKey()
    id!: string;

    @Property()
    sku!: string;

    @Property()
    displayName!:  string;
}
