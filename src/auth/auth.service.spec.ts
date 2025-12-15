import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let service: AuthService;
  let mockUsersService: jest.Mocked<UsersService>;

  // bcrypt hash of 'correctpassword' with 10 salt rounds
  const hashedPassword =
    '$2b$10$sSha3DzRA1ou/BaYFhVk5OLQvIQz0mUrKRWd1QNfjKyuY3n8XSv5C';

  const mockUser = {
    uuid: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    passwordHash: hashedPassword,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockUsersService = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user data without password when credentials are valid', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await service.validateUser(
        'test@example.com',
        'correctpassword',
      );

      expect(result).toEqual({
        uuid: mockUser.uuid,
        email: mockUser.email,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
      expect(result).not.toHaveProperty('passwordHash');
      expect(mockUsersService.findOne).toHaveBeenCalledWith('test@example.com');
    });

    it('should return null when user is not found', async () => {
      mockUsersService.findOne.mockResolvedValue(null);

      const result = await service.validateUser(
        'nonexistent@example.com',
        'anypassword',
      );

      expect(result).toBeNull();
      expect(mockUsersService.findOne).toHaveBeenCalledWith(
        'nonexistent@example.com',
      );
    });

    it('should return null when password is incorrect', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await service.validateUser(
        'test@example.com',
        'wrongpassword',
      );

      expect(result).toBeNull();
      expect(mockUsersService.findOne).toHaveBeenCalledWith('test@example.com');
    });
  });

  describe('hashPassword', () => {
    it('should return a valid bcrypt hash', async () => {
      const password = 'testpassword';
      const hash = await service.hashPassword(password);

      expect(hash).toMatch(/^\$2[aby]\$\d+\$/);
      expect(await bcrypt.compare(password, hash)).toBe(true);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'testpassword';
      const hash1 = await service.hashPassword(password);
      const hash2 = await service.hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });
});
