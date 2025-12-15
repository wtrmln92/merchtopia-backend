import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { EntityManager } from '@mikro-orm/postgresql';
import { User } from '../entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

describe('UsersService', () => {
  let service: UsersService;
  let mockEntityManager: jest.Mocked<EntityManager>;

  const mockUser: User = {
    uuid: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    passwordHash: 'hashedpassword123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockEntityManager = {
      findOne: jest.fn(),
      persist: jest.fn().mockReturnValue({ flush: jest.fn() }),
    } as unknown as jest.Mocked<EntityManager>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a user when found by email', async () => {
      mockEntityManager.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockEntityManager.findOne).toHaveBeenCalledWith(User, {
        email: 'test@example.com',
      });
    });

    it('should return null when user is not found', async () => {
      mockEntityManager.findOne.mockResolvedValue(null);

      const result = await service.findOne('nonexistent@example.com');

      expect(result).toBeNull();
      expect(mockEntityManager.findOne).toHaveBeenCalledWith(User, {
        email: 'nonexistent@example.com',
      });
    });
  });

  describe('create', () => {
    it('should create a user with hashed password', async () => {
      const createUserDto: CreateUserDto = {
        email: 'new@example.com',
        password: 'plainpassword',
      };

      const result = await service.create(createUserDto);

      expect(mockEntityManager.persist).toHaveBeenCalled();
      expect(result).toBeInstanceOf(User);
      expect(result.email).toBe(createUserDto.email);
    });

    it('should hash password with bcrypt', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'testpassword',
      };

      const result = await service.create(createUserDto);

      expect(result.passwordHash).toMatch(/^\$2[aby]\$\d+\$/);
      expect(await bcrypt.compare(createUserDto.password, result.passwordHash)).toBe(true);
    });
  });
});
