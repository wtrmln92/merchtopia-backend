import { Migration } from '@mikro-orm/migrations';

export class Migration20251213102642 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "product" drop constraint "product_pkey";`);
    this.addSql(`alter table "product" drop column "id";`);

    this.addSql(`alter table "product" add column "uuid" uuid not null default gen_random_uuid();`);
    this.addSql(`alter table "product" add constraint "product_pkey" primary key ("uuid");`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "product" drop constraint "product_pkey";`);
    this.addSql(`alter table "product" drop column "uuid";`);

    this.addSql(`alter table "product" add column "id" varchar(255) not null;`);
    this.addSql(`alter table "product" add constraint "product_pkey" primary key ("id");`);
  }

}
