import { Options, PostgreSqlDriver } from '@mikro-orm/postgresql';
import { Migrator } from '@mikro-orm/migrations';

const config: Options = {
  entities: ['./dist/entities'],
  entitiesTs: ['./src/entities'],
  dbName: 'merchtopia',
  driver: PostgreSqlDriver,
  driverOptions: {
    connection: {
      host: 'localhost',
      port: 5432,
      user: 'merchtopia',
      password: 'merchtopia'
    }
  },
  extensions: [Migrator]
}

export default config;