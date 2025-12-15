import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { LocalStrategy } from './local.strategy';
import { AuthService } from './auth.service';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let mockAuthService: jest.Mocked<AuthService>;

  const mockUser = {
    uuid: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockAuthService = {
      validateUser: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user when credentials are valid', async () => {
      mockAuthService.validateUser.mockResolvedValue(mockUser);

      const result = await strategy.validate('test@example.com', 'password123');

      expect(result).toEqual(mockUser);
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
      );
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(
        strategy.validate('test@example.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        'test@example.com',
        'wrongpassword',
      );
    });
  });
});
