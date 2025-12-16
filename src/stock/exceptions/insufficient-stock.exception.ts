import { BadRequestException } from '@nestjs/common';

export class InsufficientStockException extends BadRequestException {
  constructor(
    public readonly available: number,
    public readonly requested: number,
  ) {
    super({
      message: 'Insufficient stock',
      error: 'INSUFFICIENT_STOCK',
      available,
      requested,
    });
  }
}
