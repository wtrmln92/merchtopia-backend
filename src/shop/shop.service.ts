import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Product } from '../entities/product.entity';

@Injectable()
export class ShopService {
  constructor(private readonly em: EntityManager) {}

  findAll() {
    return this.em.findAll(Product, { where: { isOnSale: true } });
  }

  async findOne(uuid: string) {
    const product = await this.em.findOne(Product, { uuid, isOnSale: true });
    if (product == null) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }
}
