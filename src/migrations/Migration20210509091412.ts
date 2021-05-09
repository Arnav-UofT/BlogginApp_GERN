import { Migration } from '@mikro-orm/migrations';

export class Migration20210509091412 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "post" rename column "name" to "title";');
  }

}
