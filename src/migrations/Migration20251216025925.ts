import { Migration } from '@mikro-orm/migrations';

export class Migration20251216025925 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "stock_transaction" ("uuid" uuid not null default gen_random_uuid(), "product_uuid" uuid not null, "quantity" int not null, "type" text check ("type" in ('INCOMING', 'OUTGOING_ORDER', 'ADJUSTMENT')) not null, "reference_id" uuid null, "notes" varchar(255) null, "created_at" timestamptz not null default now(), constraint "stock_transaction_pkey" primary key ("uuid"));`);

    this.addSql(`alter table "stock_transaction" add constraint "stock_transaction_product_uuid_foreign" foreign key ("product_uuid") references "product" ("uuid") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "stock_transaction" cascade;`);
  }

}
