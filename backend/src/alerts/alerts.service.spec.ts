import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlertsService } from './alerts.service';
import { Alert } from './entities/alert.entity';
import { TasksService } from '../tasks/tasks.service';
import { Logger } from '@nestjs/common';

describe('AlertsService', () => {
  let service: AlertsService;
  let repository: Repository<Alert>;
  let tasksService: TasksService;

  const mockTask = {
    task_id: 'task-1',
    title: 'Test Task',
    description: 'Test Description',
    start_date: new Date(),
    delivery_date: new Date(),
  };

  const mockAlert = {
    alertId: 'alert-1',
    alertDate: new Date(),
    message: 'The task "Test Task" is due in 2 days.',
    task: mockTask,
    created_at: new Date(),
  };

  const mockRepository = {
    insert: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockTasksService = {
    findByAlertRange: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertsService,
        {
          provide: getRepositoryToken(Alert),
          useValue: mockRepository,
        },
        {
          provide: TasksService,
          useValue: mockTasksService,
        },
      ],
    }).compile();

    service = module.get<AlertsService>(AlertsService);
    repository = module.get<Repository<Alert>>(getRepositoryToken(Alert));
    tasksService = module.get<TasksService>(TasksService);

    // Mock logger
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debería crear alertas para tareas próximas a vencer', async () => {
      const tasks = [mockTask];
      mockTasksService.findByAlertRange.mockResolvedValue(tasks);
      mockRepository.insert.mockResolvedValue(undefined);

      await service.create();

      expect(mockTasksService.findByAlertRange).toHaveBeenCalled();
      expect(mockRepository.insert).toHaveBeenCalledWith({
        task: mockTask,
        alertDate: expect.any(Date),
        message: `The task "${mockTask.title}" is due in 2 days.`,
      });
    });

    it('debería no crear alertas si no hay tareas próximas a vencer', async () => {
      mockTasksService.findByAlertRange.mockResolvedValue([]);

      await service.create();

      expect(mockTasksService.findByAlertRange).toHaveBeenCalled();
      expect(mockRepository.insert).not.toHaveBeenCalled();
    });
  });

  describe('findAlertsByUserId', () => {
    it('debería retornar alertas por ID de usuario', async () => {
      const alerts = [mockAlert];
      mockRepository.find.mockResolvedValue(alerts);

      const result = await service.findAlertsByUserId('user-1');

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          task: {
            subject: {
              student: {
                studentId: 'user-1',
              },
            },
          },
        },
      });
      expect(result).toEqual(alerts);
    });

    it('debería retornar array vacío si no hay alertas para el usuario', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAlertsByUserId('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('generateAlertForTask', () => {
    it('debería generar alerta para una tarea específica', async () => {
      mockRepository.insert.mockResolvedValue(undefined);

      await service.generateAlertForTask(mockTask as any);

      expect(mockRepository.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          task: mockTask,
          message: `The task "${mockTask.title}" is due in 2 days.`,
        })
      );
      expect(mockRepository.insert).toHaveBeenCalledTimes(1);
    });
  });
});