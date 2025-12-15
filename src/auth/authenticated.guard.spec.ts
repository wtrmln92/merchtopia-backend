import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthenticatedGuard } from './authenticated.guard';

describe('AuthenticatedGuard', () => {
  let guard: AuthenticatedGuard;

  beforeEach(() => {
    guard = new AuthenticatedGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true when user is authenticated', () => {
      const mockRequest = {
        isAuthenticated: jest.fn().mockReturnValue(true),
      };

      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockRequest.isAuthenticated).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when user is not authenticated', () => {
      const mockRequest = {
        isAuthenticated: jest.fn().mockReturnValue(false),
      };

      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(mockContext)).toThrow(
        UnauthorizedException,
      );
      expect(mockRequest.isAuthenticated).toHaveBeenCalled();
    });
  });
});
