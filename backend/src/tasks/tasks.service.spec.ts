import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Task, TaskState, TaskPriority } from './entities/task.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AlertsService } from '../alerts/alerts.service';

describe('TasksService', () => {
  let service: TasksService;
  let taskRepository: Repository<Task>;
  let subjectRepository: Repository<Subject>;
  let alertsService: AlertsService;

  const mockUser = {
    sub: 'student-1',
    email: 'john@example.com',
  } as any;

  const mockSubject = {
    subjectId: 'subject-1',
    name: 'Mathematics',
    assignedTeacher: 'Dr. Smith',
  };

  const mockTask = {
    task_id: '1',
    title: 'Test Task',
    description: 'Test Description',
    start_date: new Date('2024-12-01'),
    delivery_date: new Date('2024-12-15'),
    priority: TaskPriority.HIGH,
    state: TaskState.PENDING,
    subject: mockSubject,
    subjectId: 'subject-1',
  };

  const mockTaskRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockSubjectRepository = {
    findOne: jest.fn(),
  };

  const mockAlertsService = {
    generateAlertForTask: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: mockTaskRepository,
        },
        {
          provide: getRepositoryToken(Subject),
          useValue: mockSubjectRepository,
        },
        {
          provide: AlertsService,
          useValue: mockAlertsService,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    taskRepository = module.get<Repository<Task>>(getRepositoryToken(Task));
    subjectRepository = module.get<Repository<Subject>>(getRepositoryToken(Subject));
    alertsService = module.get<AlertsService>(AlertsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debería crear una nueva tarea exitosamente', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 20);

      const createTaskDto: CreateTaskDto = {
        subjectId: 'subject-1',
        title: 'Test Task',
        description: 'Test Description',
        start_date: futureDate,
        delivery_date: deliveryDate,
        priority: TaskPriority.HIGH,
        state: TaskState.PENDING,
      };

      mockSubjectRepository.findOne.mockResolvedValue(mockSubject);
      mockTaskRepository.create.mockReturnValue(mockTask);
      mockTaskRepository.save.mockResolvedValue(mockTask);
      mockAlertsService.generateAlertForTask.mockResolvedValue(undefined);

      const result = await service.create(createTaskDto);

      expect(mockSubjectRepository.findOne).toHaveBeenCalledWith({
        where: { subjectId: 'subject-1' },
      });
      expect(mockTaskRepository.create).toHaveBeenCalled();
      expect(mockTaskRepository.save).toHaveBeenCalled();
      expect(mockAlertsService.generateAlertForTask).toHaveBeenCalledWith(mockTask);
      expect(result).toEqual(mockTask);
    });

    it('debería lanzar NotFoundException si la materia no existe', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 20);

      const createTaskDto: CreateTaskDto = {
        subjectId: 'nonexistent-subject',
        title: 'Test Task',
        description: 'Test Description',
        start_date: futureDate,
        delivery_date: deliveryDate,
        priority: TaskPriority.HIGH,
        state: TaskState.PENDING,
      };

      mockSubjectRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createTaskDto)).rejects.toThrow(NotFoundException);
    });

    it('debería lanzar BadRequestException si la fecha de inicio está en el pasado', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const createTaskDto: CreateTaskDto = {
        subjectId: 'subject-1',
        title: 'Test Task',
        description: 'Test Description',
        start_date: pastDate,
        delivery_date: futureDate,
        priority: TaskPriority.HIGH,
        state: TaskState.PENDING,
      };

      mockSubjectRepository.findOne.mockResolvedValue(mockSubject);

      await expect(service.create(createTaskDto)).rejects.toThrow(BadRequestException);
    });

    it('debería lanzar BadRequestException si la fecha de entrega es anterior a la de inicio', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 10);
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 5);

      const createTaskDto: CreateTaskDto = {
        subjectId: 'subject-1',
        title: 'Test Task',
        description: 'Test Description',
        start_date: startDate,
        delivery_date: deliveryDate,
        priority: TaskPriority.HIGH,
        state: TaskState.PENDING,
      };

      mockSubjectRepository.findOne.mockResolvedValue(mockSubject);

      await expect(service.create(createTaskDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('debería retornar todas las tareas del estudiante', async () => {
      const tasks = [mockTask];
      mockTaskRepository.find.mockResolvedValue(tasks);

      const result = await service.findAll(mockUser);

      expect(mockTaskRepository.find).toHaveBeenCalledWith({
        where: { subject: { student: { studentId: 'student-1' } } },
        relations: ['subject'],
      });
      expect(result).toEqual(tasks);
    });

    it('debería retornar array vacío si no hay tareas', async () => {
      mockTaskRepository.find.mockResolvedValue([]);

      const result = await service.findAll(mockUser);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('debería retornar una tarea por ID', async () => {
      mockTaskRepository.findOne.mockResolvedValue(mockTask);

      const result = await service.findOne('1');

      expect(mockTaskRepository.findOne).toHaveBeenCalledWith({
        where: { task_id: '1' },
        relations: ['subject'],
      });
      expect(result).toEqual(mockTask);
    });

    it('debería lanzar NotFoundException si no encuentra la tarea', async () => {
      mockTaskRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findBySubject', () => {
    it('debería retornar tareas por ID de materia', async () => {
      const tasks = [mockTask];
      mockTaskRepository.find.mockResolvedValue(tasks);

      const result = await service.findBySubject('subject-1');

      expect(mockTaskRepository.find).toHaveBeenCalledWith({
        where: { subject: { subjectId: 'subject-1' } },
        relations: ['subject'],
      });
      expect(result).toEqual(tasks);
    });

    it('debería retornar array vacío si no hay tareas para la materia', async () => {
      mockTaskRepository.find.mockResolvedValue([]);

      const result = await service.findBySubject('nonexistent-subject');

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('debería actualizar una tarea exitosamente', async () => {
      const updateTaskDto: UpdateTaskDto = {
        title: 'Updated Task',
      };

      const updatedTask = { ...mockTask, ...updateTaskDto };

      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockTaskRepository.save.mockResolvedValue(updatedTask);

      const result = await service.update('1', updateTaskDto);

      expect(mockTaskRepository.findOne).toHaveBeenCalledWith({
        where: { task_id: '1' },
        relations: ['subject'],
      });
      expect(mockTaskRepository.save).toHaveBeenCalled();
      expect(result).toEqual(updatedTask);
    });

    it('debería lanzar NotFoundException si no encuentra la tarea', async () => {
      mockTaskRepository.findOne.mockResolvedValue(null);

      await expect(service.update('999', { title: 'Updated' }))
        .rejects.toThrow(NotFoundException);
    });

    it('debería validar que la fecha de entrega sea posterior a la de inicio', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() + 5);

      const updateTaskDto: UpdateTaskDto = {
        start_date: futureDate,
        delivery_date: pastDate,
      };

      mockTaskRepository.findOne.mockResolvedValue(mockTask);

      await expect(service.update('1', updateTaskDto))
        .rejects.toThrow(BadRequestException);
    });

    it('debería actualizar la materia si se proporciona un nuevo subjectId', async () => {
      const newSubject = {
        subjectId: 'subject-2',
        name: 'Physics',
      };

      const updateTaskDto: UpdateTaskDto = {
        subjectId: 'subject-2',
      };

      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockSubjectRepository.findOne.mockResolvedValue(newSubject);
      mockTaskRepository.save.mockResolvedValue({ ...mockTask, subject: newSubject, subjectId: 'subject-2' });

      const result = await service.update('1', updateTaskDto);

      expect(mockSubjectRepository.findOne).toHaveBeenCalledWith({
        where: { subjectId: 'subject-2' },
      });
      expect(result.subjectId).toEqual('subject-2');
    });
  });

  describe('remove', () => {
    it('debería eliminar una tarea exitosamente', async () => {
      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockTaskRepository.remove.mockResolvedValue(mockTask);

      await service.remove('1');

      expect(mockTaskRepository.findOne).toHaveBeenCalledWith({
        where: { task_id: '1' },
        relations: ['subject'],
      });
      expect(mockTaskRepository.remove).toHaveBeenCalledWith(mockTask);
    });

    it('debería lanzar NotFoundException si no encuentra la tarea', async () => {
      mockTaskRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('999')).rejects.toThrow(NotFoundException);
    });
  });
});