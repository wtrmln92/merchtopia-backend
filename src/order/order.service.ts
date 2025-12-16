import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager, LockMode, sql } from '@mikro-orm/postgresql';
import { Order, OrderStatus } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Product } from '../entities/product.entity';
import { StockTransaction, StockTransactionType } from '../entities/stock-transaction.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrderService {
  constructor(private readonly em: EntityManager) {}

  async create(createOrderDto: CreateOrderDto) {
    return this.em.transactional(async (em) => {
      // Validate all products exist and lock them
      const productUuids = createOrderDto.items.map((item) => item.productUuid);
      const products = await em.find(Product, { uuid: { $in: productUuids } }, {
        lockMode: LockMode.PESSIMISTIC_WRITE,
      });

      const productMap = new Map(products.map((p) => [p.uuid, p]));

      // Check all products exist
      const missingProducts = productUuids.filter((uuid) => !productMap.has(uuid));
      if (missingProducts.length > 0) {
        throw new NotFoundException(`Products not found: ${missingProducts.join(', ')}`);
      }

      // Check stock availability for ALL items before any changes
      const stockErrors: { productUuid: string; available: number; requested: number }[] = [];

      for (const item of createOrderDto.items) {
        const result = await em
          .createQueryBuilder(StockTransaction, 'st')
          .select(sql`COALESCE(SUM(st.quantity), 0)`.as('total'))
          .where({ product: item.productUuid })
          .execute<{ total: string }>('get');

        const currentStock = Number(result.total);
        if (currentStock < item.quantity) {
          stockErrors.push({
            productUuid: item.productUuid,
            available: currentStock,
            requested: item.quantity,
          });
        }
      }

      if (stockErrors.length > 0) {
        throw new BadRequestException({
          message: 'Insufficient stock for one or more items',
          error: 'INSUFFICIENT_STOCK',
          items: stockErrors,
        });
      }

      // Create the order
      const order = new Order();
      order.customerName = createOrderDto.customerName;
      order.customerEmail = createOrderDto.customerEmail;
      order.status = OrderStatus.PENDING;

      em.persist(order);

      // Create order items and stock transactions
      for (const item of createOrderDto.items) {
        const product = productMap.get(item.productUuid)!;

        // Create OrderItem with price snapshot
        const orderItem = new OrderItem();
        orderItem.order = order;
        orderItem.product = product;
        orderItem.quantity = item.quantity;
        orderItem.unitPrice = product.price;

        em.persist(orderItem);

        // Create negative stock transaction
        const stockTransaction = new StockTransaction();
        stockTransaction.product = product;
        stockTransaction.quantity = -item.quantity;
        stockTransaction.type = StockTransactionType.OUTGOING_ORDER;
        stockTransaction.referenceId = order.uuid;

        em.persist(stockTransaction);
      }

      await em.flush();

      // Return order with items populated
      return em.findOneOrFail(Order, order.uuid, { populate: ['items', 'items.product'] });
    });
  }

  async findAll() {
    return this.em.find(Order, {}, {
      orderBy: { createdAt: 'DESC' },
      populate: ['items', 'items.product'],
    });
  }

  async findOne(uuid: string) {
    const order = await this.em.findOne(Order, uuid, {
      populate: ['items', 'items.product'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async lookup(uuid: string, email: string) {
    const order = await this.em.findOne(
      Order,
      { uuid, customerEmail: email },
      { populate: ['items', 'items.product'] },
    );

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateStatus(uuid: string, updateOrderStatusDto: UpdateOrderStatusDto) {
    const order = await this.em.findOne(Order, uuid);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Handle cancellation - restore stock
    if (updateOrderStatusDto.status === OrderStatus.CANCELLED && order.status !== OrderStatus.CANCELLED) {
      await this.restoreStockForOrder(order);
    }

    order.status = updateOrderStatusDto.status;
    await this.em.flush();

    return this.findOne(uuid);
  }

  private async restoreStockForOrder(order: Order) {
    const items = await this.em.find(OrderItem, { order: order.uuid }, { populate: ['product'] });

    for (const item of items) {
      const stockTransaction = new StockTransaction();
      stockTransaction.product = item.product;
      stockTransaction.quantity = item.quantity; // Positive to restore
      stockTransaction.type = StockTransactionType.ADJUSTMENT;
      stockTransaction.referenceId = order.uuid;
      stockTransaction.notes = 'Stock restored due to order cancellation';

      this.em.persist(stockTransaction);
    }
  }
}
