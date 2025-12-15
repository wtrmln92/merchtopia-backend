import { Migration } from '@mikro-orm/migrations';

export class Migration20251215091926 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "user" ("uuid" uuid not null default gen_random_uuid(), "email" varchar(255) not null, "password_hash" varchar(255) not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "user_pkey" primary key ("uuid"));`);
    this.addSql(`alter table "user" add constraint "user_email_unique" unique ("email");`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "user" cascade;`);
  }

}
