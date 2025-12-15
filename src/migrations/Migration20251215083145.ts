import { Migration } from '@mikro-orm/migrations';

export class Migration20251215083145 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "product" add column "deleted_at" timestamptz null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "product" drop column "deleted_at";`);
  }

}
