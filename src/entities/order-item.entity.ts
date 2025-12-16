import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";
import { Order } from "./order.entity";
import { Product } from "./product.entity";

@Entity()
export class OrderItem {
    @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
    uuid: string;

    @ManyToOne(() => Order, { index: true })
    order!: Order;

    @ManyToOne(() => Product, { index: true })
    product!: Product;

    @Property({ type: 'int' })
    quantity!: number;

    @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    unitPrice?: string;

    @Property({ defaultRaw: 'now()' })
    createdAt: Date = new Date();
}
