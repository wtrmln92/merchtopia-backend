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
    description?: string;

    @Property({ default: false })
    isOnSale: boolean = false;

    @Property({ onCreate: () => new Date(), defaultRaw: 'now()' })
    createdAt: Date = new Date();

    @Property({ onCreate: () => new Date(), onUpdate: () => new Date(), defaultRaw: 'now()' })
    updatedAt: Date = new Date();

    @Property({ nullable: true })
    deletedAt?: Date;
}
