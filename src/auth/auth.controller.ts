import { Controller, Get, Post, Request, UnauthorizedException, UseGuards } from '@nestjs/common';
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
}
