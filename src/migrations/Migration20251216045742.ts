import { Migration } from '@mikro-orm/migrations';

export class Migration20251216045742 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "product" add column "description" varchar(255) null, add column "is_on_sale" boolean not null default false, add column "created_at" timestamptz not null default now(), add column "updated_at" timestamptz not null default now();`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "product" drop column "description", drop column "is_on_sale", drop column "created_at", drop column "updated_at";`);
  }

}
