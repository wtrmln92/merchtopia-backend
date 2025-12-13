import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity()
export class Product {
    @PrimaryKey({type: 'uuid', defaultRaw: 'gen_random_uuid()'})
    uuid: string;

    @Property()
    sku!: string;

    @Property()
    displayName!:  string;
}
