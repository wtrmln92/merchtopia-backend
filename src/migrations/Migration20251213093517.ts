import { Migration } from '@mikro-orm/migrations';

export class Migration20251213093517 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "product" ("id" varchar(255) not null, "sku" varchar(255) not null, "display_name" varchar(255) not null, constraint "product_pkey" primary key ("id"));`);
  }
  
  override async down(): Promise<void> {
    this.addSql(`drop table "product"`)
  }
}
