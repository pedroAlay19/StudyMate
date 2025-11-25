import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { Subject } from './entities/subject.entity';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { UsersService } from '../users/users.service';

describe('SubjectsService', () => {
  let service: SubjectsService;
  let repository: Repository<Subject>;
  let usersService: UsersService;

  const mockUser = {
    sub: 'student-1',
    email: 'john@example.com',
  } as any;

  const mockStudent = {
    studentId: 'student-1',
    name: 'John Doe',
    email: 'john@example.com',
  };

  const mockSubject = {
    subjectId: 'subject-1',
    name: 'Mathematics',
    assignedTeacher: 'Dr. Smith',
    schedule: [
      { day: 'Monday', start: '08:00', end: '10:00' }
    ],
    color: '#FF5733',
    student: mockStudent,
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  const mockUsersService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubjectsService,
        {
          provide: getRepositoryToken(Subject),
          useValue: mockRepository,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<SubjectsService>(SubjectsService);
    repository = module.get<Repository<Subject>>(getRepositoryToken(Subject));
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debería crear una nueva materia exitosamente', async () => {
      const createSubjectDto: CreateSubjectDto = {
        name: 'Mathematics',
        assignedTeacher: 'Dr. Smith',
        schedule: [],
        color: '#FF5733',
      };

      mockUsersService.findOne.mockResolvedValue(mockStudent);
      mockRepository.find.mockResolvedValue([]);
      mockRepository.create.mockReturnValue(mockSubject);
      mockRepository.save.mockResolvedValue(mockSubject);

      const result = await service.create(createSubjectDto, mockUser);

      expect(mockUsersService.findOne).toHaveBeenCalledWith('student-1');
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createSubjectDto,
        student: mockStudent,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockSubject);
      expect(result).toEqual(mockSubject);
    });

    it('debería lanzar NotFoundException cuando el estudiante no existe', async () => {
      const createSubjectDto: CreateSubjectDto = {
        name: 'Mathematics',
        assignedTeacher: 'Dr. Smith',
        schedule: [],
        color: '#FF5733',
      };

      const invalidUser = { sub: 'nonexistent-student', email: 'test@test.com' } as any;
      mockUsersService.findOne.mockRejectedValue(new NotFoundException());

      await expect(service.create(createSubjectDto, invalidUser)).rejects.toThrow(NotFoundException);
    });

    it('debería lanzar BadRequestException cuando hay conflicto de horario', async () => {
      const createSubjectDto: CreateSubjectDto = {
        name: 'Physics',
        assignedTeacher: 'Dr. Johnson',
        schedule: [{ day: 'Monday', start: '08:00', end: '10:00' }],
        color: '#00FF00',
      };

      const existingSubject = {
        subjectId: 'subject-2',
        name: 'Chemistry',
        schedule: [{ day: 'Monday', start: '09:00', end: '11:00' }],
      };

      mockUsersService.findOne.mockResolvedValue(mockStudent);
      mockRepository.find.mockResolvedValue([existingSubject]);

      await expect(service.create(createSubjectDto, mockUser)).rejects.toThrow(BadRequestException);
    });

    it('debería manejar errores del repositorio', async () => {
      const createSubjectDto: CreateSubjectDto = {
        name: 'Mathematics',
        assignedTeacher: 'Dr. Smith',
        schedule: [],
        color: '#FF5733',
      };

      mockUsersService.findOne.mockResolvedValue(mockStudent);
      mockRepository.find.mockResolvedValue([]);
      mockRepository.create.mockReturnValue(mockSubject);
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.create(createSubjectDto, mockUser)).rejects.toThrow('Database error');
    });
  });

  describe('findAll', () => {
    it('debería retornar todas las materias del estudiante', async () => {
      const subjects = [mockSubject];
      mockRepository.find.mockResolvedValue(subjects);

      const result = await service.findAll(mockUser);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { student: { studentId: 'student-1' } },
      });
      expect(result).toEqual(subjects);
    });

    it('debería retornar array vacío si no hay materias', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAll(mockUser);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('debería retornar una materia por ID', async () => {
      mockRepository.findOne.mockResolvedValue(mockSubject);

      const result = await service.findOne('subject-1');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { subjectId: 'subject-1' },
      });
      expect(result).toEqual(mockSubject);
    });

    it('debería lanzar NotFoundException si no encuentra la materia', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('debería actualizar una materia exitosamente', async () => {
      const updateSubjectDto: UpdateSubjectDto = {
        name: 'Updated Mathematics',
      };

      const updatedSubject = { ...mockSubject, ...updateSubjectDto };

      mockRepository.findOne.mockResolvedValueOnce(mockSubject);
      mockRepository.save.mockResolvedValue(updatedSubject);

      const result = await service.update('subject-1', updateSubjectDto);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { subjectId: 'subject-1' },
      });
      expect(mockRepository.save).toHaveBeenCalledWith(updatedSubject);
      expect(result).toEqual(updatedSubject);
    });

    it('debería lanzar NotFoundException si no encuentra la materia', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update('999', { name: 'Updated' }))
        .rejects.toThrow(NotFoundException);
    });

    it('debería validar conflictos de horario al actualizar', async () => {
      const updateSubjectDto: UpdateSubjectDto = {
        schedule: [{ day: 'Monday', start: '08:00', end: '10:00' }],
      };

      const subjectWithStudent = {
        ...mockSubject,
        student: mockStudent,
      };

      const conflictingSubject = {
        subjectId: 'subject-2',
        name: 'Chemistry',
        schedule: [{ day: 'Monday', start: '09:00', end: '11:00' }],
      };

      mockRepository.findOne
        .mockResolvedValueOnce(mockSubject)
        .mockResolvedValueOnce(subjectWithStudent);
      mockRepository.find.mockResolvedValue([conflictingSubject]);

      await expect(service.update('subject-1', updateSubjectDto))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('debería eliminar una materia exitosamente', async () => {
      mockRepository.findOne.mockResolvedValue(mockSubject);
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.remove('subject-1');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { subjectId: 'subject-1' },
      });
      expect(mockRepository.delete).toHaveBeenCalledWith('subject-1');
      expect(result).toEqual({ affected: 1 });
    });

    it('debería lanzar NotFoundException si no encuentra la materia', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('999')).rejects.toThrow(NotFoundException);
    });
  });
});