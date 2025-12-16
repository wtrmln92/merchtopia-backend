import { Controller, Get, Post, Body, Param, Patch, Query, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { AuthenticatedGuard } from '../auth/authenticated.guard';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.create(createOrderDto);
  }

  @Get()
  @UseGuards(AuthenticatedGuard)
  findAll() {
    return this.orderService.findAll();
  }

  @Get('lookup/:uuid')
  lookup(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Query('email') email: string,
  ) {
    return this.orderService.lookup(uuid, email);
  }

  @Get(':uuid')
  @UseGuards(AuthenticatedGuard)
  findOne(@Param('uuid', ParseUUIDPipe) uuid: string) {
    return this.orderService.findOne(uuid);
  }

  @Patch(':uuid/status')
  @UseGuards(AuthenticatedGuard)
  updateStatus(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateStatus(uuid, updateOrderStatusDto);
  }
}
