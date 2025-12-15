import { Injectable } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { EntityManager } from '@mikro-orm/postgresql';

@Injectable()
export class UsersService {
  constructor(private readonly em: EntityManager) {}

  async findOne(username: string) {
    return this.em.findOne(User, { email: username });
  }
}
