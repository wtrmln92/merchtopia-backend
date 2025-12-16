import { Migration } from '@mikro-orm/migrations';

export class Migration20251216095727 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "order" ("uuid" uuid not null default gen_random_uuid(), "customer_name" varchar(255) null, "customer_email" varchar(255) not null, "status" text check ("status" in ('PENDING', 'CONFIRMED', 'CANCELLED', 'FULFILLED')) not null default 'PENDING', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "order_pkey" primary key ("uuid"));`);

    this.addSql(`create table "order_item" ("uuid" uuid not null default gen_random_uuid(), "order_uuid" uuid not null, "product_uuid" uuid not null, "quantity" int not null, "unit_price" numeric(10,2) null, "created_at" timestamptz not null default now(), constraint "order_item_pkey" primary key ("uuid"));`);
    this.addSql(`create index "order_item_order_uuid_index" on "order_item" ("order_uuid");`);
    this.addSql(`create index "order_item_product_uuid_index" on "order_item" ("product_uuid");`);

    this.addSql(`alter table "order_item" add constraint "order_item_order_uuid_foreign" foreign key ("order_uuid") references "order" ("uuid") on update cascade;`);
    this.addSql(`alter table "order_item" add constraint "order_item_product_uuid_foreign" foreign key ("product_uuid") references "product" ("uuid") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "order_item" drop constraint "order_item_order_uuid_foreign";`);

    this.addSql(`drop table if exists "order" cascade;`);

    this.addSql(`drop table if exists "order_item" cascade;`);
  }

}
