import { Test, TestingModule } from '@nestjs/testing';
import { SubjectsController } from './subjects.controller';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

describe('SubjectsController', () => {
  let controller: SubjectsController;
  let service: SubjectsService;

  const mockUser = {
    sub: 'student-1',
    email: 'john@example.com',
  } as any;

  const mockSubject = {
    subjectId: 'subject-1',
    name: 'Mathematics',
    assignedTeacher: 'Dr. Smith',
    schedule: [
      { day: 'Monday', start: '08:00', end: '10:00' },
      { day: 'Wednesday', start: '08:00', end: '10:00' },
    ],
    color: '#FF5733',
  };

  const mockSubjectsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubjectsController],
      providers: [
        {
          provide: SubjectsService,
          useValue: mockSubjectsService,
        },
      ],
    }).compile();

    controller = module.get<SubjectsController>(SubjectsController);
    service = module.get<SubjectsService>(SubjectsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new subject', async () => {
      const createSubjectDto: CreateSubjectDto = {
        name: 'Mathematics',
        assignedTeacher: 'Dr. Smith',
        schedule: [
          { day: 'Monday', start: '08:00', end: '10:00' },
          { day: 'Wednesday', start: '08:00', end: '10:00' },
        ],
        color: '#FF5733',
      };

      mockSubjectsService.create.mockResolvedValue(mockSubject);

      const result = await controller.create(createSubjectDto, mockUser);

      expect(result).toEqual(mockSubject);
      expect(service.create).toHaveBeenCalledWith(createSubjectDto, mockUser);
      expect(service.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('should return an array of subjects', async () => {
      const subjects = [mockSubject];
      mockSubjectsService.findAll.mockResolvedValue(subjects);

      const result = await controller.findAll(mockUser);

      expect(result).toEqual(subjects);
      expect(service.findAll).toHaveBeenCalledWith(mockUser);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return an empty array when no subjects exist', async () => {
      mockSubjectsService.findAll.mockResolvedValue([]);

      const result = await controller.findAll(mockUser);

      expect(result).toEqual([]);
      expect(service.findAll).toHaveBeenCalledWith(mockUser);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a subject by id', async () => {
      const subjectId = 'subject-1';
      mockSubjectsService.findOne.mockResolvedValue(mockSubject);

      const result = await controller.findOne(subjectId);

      expect(result).toEqual(mockSubject);
      expect(service.findOne).toHaveBeenCalledWith(subjectId);
      expect(service.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('should update a subject', async () => {
      const subjectId = 'subject-1';
      const updateSubjectDto: UpdateSubjectDto = {
        name: 'Advanced Mathematics',
        assignedTeacher: 'Dr. Johnson',
      };
      const updatedSubject = { ...mockSubject, ...updateSubjectDto };

      mockSubjectsService.update.mockResolvedValue(updatedSubject);

      const result = await controller.update(subjectId, updateSubjectDto);

      expect(result).toEqual(updatedSubject);
      expect(service.update).toHaveBeenCalledWith(subjectId, updateSubjectDto);
      expect(service.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove', () => {
    it('should remove a subject', async () => {
      const subjectId = 'subject-1';
      mockSubjectsService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(subjectId);

      expect(result).toBeUndefined();
      expect(service.remove).toHaveBeenCalledWith(subjectId);
      expect(service.remove).toHaveBeenCalledTimes(1);
    });
  });
});
