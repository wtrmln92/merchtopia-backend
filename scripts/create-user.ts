import { NestFactory } from '@nestjs/core';
import { password } from '@inquirer/prompts';
import { MikroORM } from '@mikro-orm/core';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { User } from '../src/entities/user.entity';
import { SALT_ROUNDS } from '../src/auth/auth.constants';

async function bootstrap() {
  const email = process.argv[2];

  if (!email) {
    console.error('Usage: pnpm run create-user <email>');
    process.exit(1);
  }

  const userPassword = await password({ message: 'Password:' });

  if (userPassword.length < 8) {
    console.error('Error: Password must be at least 8 characters');
    process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(AppModule);
  const orm = app.get(MikroORM);
  const em = orm.em.fork();

  try {
    const user = new User();
    user.email = email;
    user.passwordHash = await bcrypt.hash(userPassword, SALT_ROUNDS);
    await em.persist(user).flush();
    console.log(`User created: ${user.email}`);
  } catch (error: any) {
    if (error.code === '23505') {
      console.error(`Error: User with email "${email}" already exists`);
    } else {
      console.error('Error creating user:', error.message);
    }
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
