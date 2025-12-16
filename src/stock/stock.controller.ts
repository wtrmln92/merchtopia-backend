import { Controller, Get, Post, Body, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { StockService } from './stock.service';
import { AddStockDto } from './dto/add-stock.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { AuthenticatedGuard } from '../auth/authenticated.guard';

@Controller('stock')
@UseGuards(AuthenticatedGuard)
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Post('incoming')
  addIncoming(@Body() addStockDto: AddStockDto) {
    return this.stockService.addIncoming(addStockDto);
  }

  @Post('adjust')
  adjust(@Body() adjustStockDto: AdjustStockDto) {
    return this.stockService.adjust(adjustStockDto);
  }

  @Get(':productUuid')
  getStockLevel(@Param('productUuid', ParseUUIDPipe) productUuid: string) {
    return this.stockService.getStockLevel(productUuid);
  }

  @Get(':productUuid/transactions')
  getTransactions(@Param('productUuid', ParseUUIDPipe) productUuid: string) {
    return this.stockService.getTransactions(productUuid);
  }
}
