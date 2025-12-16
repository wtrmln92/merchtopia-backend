import { Migration } from '@mikro-orm/migrations';

export class Migration20251216054458 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "product" add column "price" numeric(10,2) not null default '10.00';`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "product" drop column "price";`);
  }

}
