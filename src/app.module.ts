import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductModule } from './product/product.module';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StockModule } from './stock/stock.module';
import { ShopModule } from './shop/shop.module';
import { OrderModule } from './order/order.module';

@Module({
  imports: [
    MikroOrmModule.forRoot(),
    ProductModule,
    AuthModule,
    UsersModule,
    StockModule,
    ShopModule,
    OrderModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
