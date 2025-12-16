import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ShopService } from './shop.service';

@Controller('shop')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Get('products')
  findAll() {
    return this.shopService.findAll();
  }

  @Get('products/:id')
  findOne(@Param('id', ParseUUIDPipe) uuid: string) {
    return this.shopService.findOne(uuid);
  }
}
