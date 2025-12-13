import { IsNotEmpty, IsString} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({value}) => value.trim())
  sku: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({value}) => value.trim())
  displayName: string;
}
