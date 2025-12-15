import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { EntityManager } from '@mikro-orm/postgresql';
import { CreateUserDto } from './dto/create-user.dto';
import { SALT_ROUNDS } from '../auth/auth.constants';

@Injectable()
export class UsersService {
  constructor(private readonly em: EntityManager) {}

  async findOne(username: string) {
    return this.em.findOne(User, { email: username });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, password } = createUserDto;
    const user = new User();
    user.email = email;
    user.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    await this.em.persist(user).flush();
    return user;
  }
}
