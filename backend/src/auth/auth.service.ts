import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateStudentDto } from 'src/users/dto/create-user.dto';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UserPayload } from './interfaces/user.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
  ) {}
  async register(registerDto: CreateStudentDto) {
    return await this.userService.create(registerDto);
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{
    access_token: string;
    user: { studentId: string; name: string; email: string };
  }> {
    const user = await this.userService.findByEmail(loginDto.email);
    if (!user) throw new UnauthorizedException('email is wrong');
    if (!user.active) throw new ForbiddenException('User account is inactive');

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) throw new UnauthorizedException('password is wrong');

    const payload: UserPayload = {
      sub: user.studentId,
      email: user.email,
      role: user.role,
    };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        studentId: user.studentId,
        name: user.name,
        email: user.email,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.userService.findOne(userId);
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }
}
