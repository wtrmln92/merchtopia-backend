import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Post,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { LocalAuthGuard } from './local-auth.guard';

@Controller('auth')
export class AuthController {
  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@Request() req) {
    return req.user;
  }

  @Get('me')
  me(@Request() req) {
    if (!req.user) throw new UnauthorizedException();
    return req.user;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Request() req): Promise<{ message: string }> {
    return new Promise((resolve, reject) => {
      req.logout((err) => {
        if (err) {
          reject(new InternalServerErrorException('Logout failed'));
          return;
        }
        req.session.destroy((destroyErr) => {
          if (destroyErr) {
            reject(new InternalServerErrorException('Session destruction failed'));
            return;
          }
          resolve({ message: 'Logged out successfully' });
        });
      });
    });
  }
}
