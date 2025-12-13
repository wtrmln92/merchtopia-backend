import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { EntityManager } from '@mikro-orm/postgresql';
import { Product } from '../../src/entities/product.entity';

@Injectable()
export class ProductService {
  constructor(
    private readonly em: EntityManager,
  ) {}

  async create(createProductDto: CreateProductDto) {
    const {sku, displayName} = createProductDto;
    const product = new Product();
    product.sku = sku
    product.displayName = displayName
    await this.em.persist(product).flush();
    return product;
  }

  findAll() {
    return this.em.findAll(Product);
  }

  findOne(id: number) {
    return `This action returns a #${id} product`;
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }
}
