import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  let controller: AuthController;

  const mockUser = {
    uuid: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    controller = new AuthController();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return user from request', () => {
      const mockRequest = { user: mockUser };

      const result = controller.login(mockRequest);

      expect(result).toEqual(mockUser);
    });
  });

  describe('me', () => {
    it('should return user when authenticated', () => {
      const mockRequest = { user: mockUser };

      const result = controller.me(mockRequest);

      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException when user is not present', () => {
      const mockRequest = { user: null };

      expect(() => controller.me(mockRequest)).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is undefined', () => {
      const mockRequest = {};

      expect(() => controller.me(mockRequest)).toThrow(UnauthorizedException);
    });
  });
});
