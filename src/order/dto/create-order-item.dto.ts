import { IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';

export class CreateOrderItemDto {
  @IsUUID()
  @IsNotEmpty()
  productUuid: string;

  @IsInt()
  @Min(1)
  quantity: number;
}
