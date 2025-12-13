import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productService.create(createProductDto);
  }

  @Get()
  findAll() {
    return this.productService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) uuid: string) {
    return this.productService.findOne(uuid);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) uuid: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productService.update(uuid, updateProductDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) uuid: string) {
    return this.productService.remove(uuid);
  }
}
