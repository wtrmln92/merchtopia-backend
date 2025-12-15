import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { MikroORM } from '@mikro-orm/core';
import { User } from '../entities/user.entity';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private readonly orm: MikroORM) {
    super();
  }

  serializeUser(user: any, done: (err: Error | null, user: any) => void) {
    done(null, user.email);
  }

  async deserializeUser(email: string, done: (err: Error | null, user: any) => void) {
    const em = this.orm.em.fork();
    const user = await em.findOne(User, { email });
    if (user) {
      const { passwordHash, ...result } = user;
      done(null, result);
    } else {
      done(null, null);
    }
  }
}
