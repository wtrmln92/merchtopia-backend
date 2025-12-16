import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, NotEquals } from 'class-validator';
import { Transform } from 'class-transformer';

export class AdjustStockDto {
  @IsUUID()
  @IsNotEmpty()
  productUuid: string;

  @IsInt()
  @NotEquals(0)
  quantity: number;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  notes?: string;
}
