import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
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

  async getStockLevel(productUuid: string) {
    const product = await this.em.findOne(Product, productUuid);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const result = await this.em
      .createQueryBuilder(StockTransaction, 'st')
      .select('SUM(st.quantity) as stock')
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
