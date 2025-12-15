import {
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
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

  describe('logout', () => {
    it('should successfully logout and destroy session', async () => {
      const mockRequest = {
        logout: jest.fn((callback) => callback(null)),
        session: {
          destroy: jest.fn((callback) => callback(null)),
        },
      };

      const result = await controller.logout(mockRequest);

      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(mockRequest.logout).toHaveBeenCalled();
      expect(mockRequest.session.destroy).toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException when logout fails', async () => {
      const mockRequest = {
        logout: jest.fn((callback) => callback(new Error('Logout error'))),
        session: {
          destroy: jest.fn(),
        },
      };

      await expect(controller.logout(mockRequest)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(mockRequest.logout).toHaveBeenCalled();
      expect(mockRequest.session.destroy).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException when session destruction fails', async () => {
      const mockRequest = {
        logout: jest.fn((callback) => callback(null)),
        session: {
          destroy: jest.fn((callback) =>
            callback(new Error('Session destroy error')),
          ),
        },
      };

      await expect(controller.logout(mockRequest)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(mockRequest.logout).toHaveBeenCalled();
      expect(mockRequest.session.destroy).toHaveBeenCalled();
    });
  });
});
