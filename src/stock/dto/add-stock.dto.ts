import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class AddStockDto {
  @IsUUID()
  @IsNotEmpty()
  productUuid: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  notes?: string;
}
