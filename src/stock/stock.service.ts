import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InsufficientStockException } from './exceptions/insufficient-stock.exception';
import { EntityManager, LockMode, sql } from '@mikro-orm/postgresql';
import {
  StockTransaction,
  StockTransactionType,
} from '../entities/stock-transaction.entity';
import { Product } from '../entities/product.entity';
import { AddStockDto } from './dto/add-stock.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';

@Injectable()
export class StockService {
  constructor(private readonly em: EntityManager) {}

  async addIncoming(addStockDto: AddStockDto) {
    const product = await this.em.findOne(Product, addStockDto.productUuid);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const transaction = new StockTransaction();
    transaction.product = product;
    transaction.quantity = addStockDto.quantity;
    transaction.type = StockTransactionType.INCOMING;
    transaction.notes = addStockDto.notes;

    await this.em.persist(transaction).flush();
    return transaction;
  }

  async adjust(adjustStockDto: AdjustStockDto) {
    if (adjustStockDto.quantity < 0) {
      return this.deductStock(
        adjustStockDto.productUuid,
        Math.abs(adjustStockDto.quantity),
        StockTransactionType.ADJUSTMENT,
        undefined,
        adjustStockDto.notes,
      );
    }

    const product = await this.em.findOne(Product, adjustStockDto.productUuid);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const transaction = new StockTransaction();
    transaction.product = product;
    transaction.quantity = adjustStockDto.quantity;
    transaction.type = StockTransactionType.ADJUSTMENT;
    transaction.notes = adjustStockDto.notes;

    await this.em.persist(transaction).flush();
    return transaction;
  }

  async deductStock(
    productUuid: string,
    quantity: number,
    type: StockTransactionType = StockTransactionType.OUTGOING_ORDER,
    referenceId?: string,
    notes?: string,
  ) {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be positive');
    }

    return this.em.transactional(async (em) => {
      const product = await em.findOne(Product, productUuid, {
        lockMode: LockMode.PESSIMISTIC_WRITE,
      });
      if (!product) {
        throw new NotFoundException('Product not found');
      }

      const result = await em
        .createQueryBuilder(StockTransaction, 'st')
        .select(sql`COALESCE(SUM(st.quantity), 0)`.as('total'))
        .where({ product: productUuid })
        .execute<{ total: string }>('get');

      const currentStock = Number(result.total);
      if (currentStock < quantity) {
        throw new InsufficientStockException(currentStock, quantity);
      }

      const transaction = new StockTransaction();
      transaction.product = product;
      transaction.quantity = -quantity;
      transaction.type = type;
      transaction.referenceId = referenceId;
      transaction.notes = notes;

      await em.persist(transaction).flush();
      return transaction;
    });
  }

  async getStockLevel(productUuid: string) {
    const product = await this.em.findOne(Product, productUuid);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const result = await this.em
      .createQueryBuilder(StockTransaction, 'st')
      .select(sql`SUM(st.quantity)`.as('stock'))
      .where({ product: productUuid })
      .execute<{ stock: string | null }>('get');
    return {
      productUuid,
      stock: result?.stock ? +result.stock : 0,
    };
  }

  async getTransactions(productUuid: string) {
    const product = await this.em.findOne(Product, productUuid);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.em.find(
      StockTransaction,
      { product: productUuid },
      { orderBy: { createdAt: 'DESC' } },
    );
  }
}
