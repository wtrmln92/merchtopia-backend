import { Migration } from '@mikro-orm/migrations';

export class Migration20251216061427 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create index "stock_transaction_product_uuid_index" on "stock_transaction" ("product_uuid");`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index "stock_transaction_product_uuid_index";`);
  }

}
