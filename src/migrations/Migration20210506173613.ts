import { Migration } from "@mikro-orm/migrations";

export class Migration20210506173613 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table "post" drop constraint if exists "post_created_at_check";'
    );
    this.addSql(
      'alter table "post" alter column "created_at" type timestamptz(0) using ("created_at"::timestamptz(0));'
    );
  }
}
