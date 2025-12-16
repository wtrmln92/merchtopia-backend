import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { EntityManager } from '@mikro-orm/postgresql';
import { Product } from '../../src/entities/product.entity';

@Injectable()
export class ProductService {
  constructor(private readonly em: EntityManager) {}

  async create(createProductDto: CreateProductDto) {
    const { price, ...rest } = createProductDto;
    const product = new Product();
    this.em.assign(product, {
      ...rest,
      price: price.toFixed(2),
    });
    await this.em.persist(product).flush();
    return product;
  }

  findAll() {
    return this.em.findAll(Product);
  }

  async findOne(uuid: string) {
    const product = await this.em.findOne(Product, uuid);
    if (product == null) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async update(uuid: string, updateProductDto: UpdateProductDto) {
    const product = await this.em.findOne(Product, uuid);
    if (product == null) {
      throw new NotFoundException('Product not found');
    }

    const { price, ...rest } = updateProductDto;
    this.em.assign(product, {
      ...rest,
      ...(price !== undefined && { price: price.toFixed(2) }),
    });
    await this.em.flush();
    return product;
  }

  async remove(uuid: string) {
    const product = await this.findOne(uuid);
    if (product == null) {
      throw new NotFoundException('Product not found');
    }
    product.deletedAt = new Date();
    await this.em.flush();
  }
}
