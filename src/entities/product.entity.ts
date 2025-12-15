import { Entity, Filter, PrimaryKey, Property } from "@mikro-orm/core";

@Entity()
@Filter({ name: 'softDelete', cond: { deletedAt: null }, default: true })
export class Product {
    @PrimaryKey({type: 'uuid', defaultRaw: 'gen_random_uuid()'})
    uuid: string;

    @Property()
    sku!: string;

    @Property()
    displayName!:  string;

    @Property({ nullable: true })
    deletedAt?: Date;
}
