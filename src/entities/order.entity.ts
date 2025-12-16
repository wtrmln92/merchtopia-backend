import { Collection, Entity, Enum, Filter, OneToMany, PrimaryKey, Property } from "@mikro-orm/core";
import { OrderItem } from "./order-item.entity";

export enum OrderStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    CANCELLED = 'CANCELLED',
    FULFILLED = 'FULFILLED',
}

@Entity()
@Filter({ name: 'softDelete', cond: { deletedAt: null }, default: true })
export class Order {
    @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
    uuid: string;

    @Property({ nullable: true })
    customerName?: string;

    @Property()
    customerEmail!: string;

    @Enum(() => OrderStatus)
    status: OrderStatus = OrderStatus.PENDING;

    @OneToMany(() => OrderItem, item => item.order)
    items = new Collection<OrderItem>(this);

    @Property({ onCreate: () => new Date(), defaultRaw: 'now()' })
    createdAt: Date = new Date();

    @Property({ onCreate: () => new Date(), onUpdate: () => new Date(), defaultRaw: 'now()' })
    updatedAt: Date = new Date();

    @Property({ nullable: true })
    deletedAt?: Date;
}
