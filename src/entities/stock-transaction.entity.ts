import { Entity, Enum, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";
import { Product } from "./product.entity";

export enum StockTransactionType {
    INCOMING = 'INCOMING',
    OUTGOING_ORDER = 'OUTGOING_ORDER',
    ADJUSTMENT = 'ADJUSTMENT',
}

@Entity()
export class StockTransaction {
    @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
    uuid: string;

    @ManyToOne(() => Product, { index: true })
    product!: Product;

    @Property({ type: 'int' })
    quantity!: number;

    @Enum(() => StockTransactionType)
    type!: StockTransactionType;

    @Property({ type: 'uuid', nullable: true })
    referenceId?: string;

    @Property({ nullable: true })
    notes?: string;

    @Property({ defaultRaw: 'now()' })
    createdAt: Date = new Date();
}
