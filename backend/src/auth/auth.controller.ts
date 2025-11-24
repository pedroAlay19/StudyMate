import { Body, Controller, Get, Post,  Request,  UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateStudentDto } from 'src/users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from './guard/auth.guard';
import { ActiveUser } from './decorators/active-user.decorator';
import type { UserPayload } from './interfaces/user.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() registerDto: CreateStudentDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('profile')
  @UseGuards(AuthGuard)
  getProfile(@ActiveUser() user: UserPayload) {
    return this.authService.getProfile(user.sub);
  }
}
