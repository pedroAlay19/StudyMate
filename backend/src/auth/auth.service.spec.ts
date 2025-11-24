import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { CreateStudentDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUser = {
    studentId: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedPassword123',
    active: true,
    role: 'student' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsersService = {
    create: jest.fn(),
    findByEmail: jest.fn(),
    findOne: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('debería registrar un nuevo usuario exitosamente', async () => {
      const createStudentDto: CreateStudentDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await service.register(createStudentDto);

      expect(mockUsersService.create).toHaveBeenCalledWith(createStudentDto);
      expect(result).toEqual(mockUser);
    });
  });

  describe('login', () => {
    it('debería autenticar un usuario exitosamente', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockToken = 'mock.jwt.token';

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.signAsync.mockResolvedValue(mockToken);

      const result = await service.login(loginDto);

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, mockUser.password);
      expect(mockJwtService.signAsync).toHaveBeenCalledWith({
        sub: mockUser.studentId,
        email: mockUser.email,
        role: mockUser.role,
      });
      expect(result).toEqual({
        access_token: mockToken,
        user: {
          studentId: mockUser.studentId,
          name: mockUser.name,
          email: mockUser.email,
        },
      });
    });

    it('debería lanzar UnauthorizedException si el email es incorrecto', async () => {
      const loginDto: LoginDto = {
        email: 'wrong@example.com',
        password: 'password123',
      };

      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto))
        .rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto))
        .rejects.toThrow('email is wrong');
    });

    it('debería lanzar ForbiddenException si el usuario está inactivo', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const inactiveUser = { ...mockUser, active: false };
      mockUsersService.findByEmail.mockResolvedValue(inactiveUser);

      await expect(service.login(loginDto))
        .rejects.toThrow(ForbiddenException);
      await expect(service.login(loginDto))
        .rejects.toThrow('User account is inactive');
    });

    it('debería lanzar UnauthorizedException si la contraseña es incorrecta', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto))
        .rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto))
        .rejects.toThrow('password is wrong');
    });
  });

  describe('getProfile', () => {
    it('debería retornar el perfil del usuario exitosamente', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await service.getProfile('user-1');

      expect(mockUsersService.findOne).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockUser);
    });

    it('debería lanzar UnauthorizedException si el usuario no existe', async () => {
      mockUsersService.findOne.mockResolvedValue(null);

      await expect(service.getProfile('nonexistent-user'))
        .rejects.toThrow(UnauthorizedException);
      await expect(service.getProfile('nonexistent-user'))
        .rejects.toThrow('User not found');
    });
  });
});