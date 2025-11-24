import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateStudentDto } from './dto/create-user.dto';
import { UpdateStudentsDto } from './dto/update-user.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockStudent = {
    studentId: 'student-1',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'hashedPassword',
  };

  const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new student', async () => {
      const createStudentDto: CreateStudentDto = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      mockUsersService.create.mockResolvedValue(mockStudent);

      const result = await controller.create(createStudentDto);

      expect(result).toEqual(mockStudent);
      expect(service.create).toHaveBeenCalledWith(createStudentDto);
      expect(service.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('should return an array of students', async () => {
      const students = [mockStudent];
      mockUsersService.findAll.mockResolvedValue(students);

      const result = await controller.findAll();

      expect(result).toEqual(students);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return an empty array when no students exist', async () => {
      mockUsersService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a student by id', async () => {
      const studentId = 'student-1';
      mockUsersService.findOne.mockResolvedValue(mockStudent);

      const result = await controller.findOne(studentId);

      expect(result).toEqual(mockStudent);
      expect(service.findOne).toHaveBeenCalledWith(studentId);
      expect(service.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('should update a student', async () => {
      const studentId = 'student-1';
      const updateStudentsDto: UpdateStudentsDto = {
        name: 'Jane Doe',
      };
      const updatedStudent = { ...mockStudent, ...updateStudentsDto };

      mockUsersService.update.mockResolvedValue(updatedStudent);

      const result = await controller.update(studentId, updateStudentsDto);

      expect(result).toEqual(updatedStudent);
      expect(service.update).toHaveBeenCalledWith(studentId, updateStudentsDto);
      expect(service.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove', () => {
    it('should remove a student', async () => {
      const studentId = 'student-1';
      mockUsersService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(studentId);

      expect(result).toBeUndefined();
      expect(service.remove).toHaveBeenCalledWith(studentId);
      expect(service.remove).toHaveBeenCalledTimes(1);
    });
  });
});
