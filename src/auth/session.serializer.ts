import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { UsersService } from '../users/users.service';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private readonly usersService: UsersService) {
    super();
  }

  serializeUser(user: any, done: (err: Error | null, user: any) => void) {
    done(null, user.email);
  }

  async deserializeUser(email: string, done: (err: Error | null, user: any) => void) {
    const user = await this.usersService.findOne(email);
    if (user) {
      const { passwordHash, ...result } = user;
      done(null, result);
    } else {
      done(null, null);
    }
  }
}
