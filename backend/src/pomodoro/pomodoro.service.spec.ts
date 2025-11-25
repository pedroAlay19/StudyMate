import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { PromodoroService } from './pomodoro.service';
import { PromodoroSession } from './entities/pomodoro-session.entity';
import { Task } from '../tasks/entities/task.entity';
import { CreatePromodoroSessionDto } from './dto/create-pomodoro-session.dto';
import { UpdatePromodoroSessionDto } from './dto/update-pomodoro-session.dto';

describe('PromodoroService', () => {
  let service: PromodoroService;
  let promodoroRepository: Repository<PromodoroSession>;
  let taskRepository: Repository<Task>;

  const mockTask = {
    task_id: 'task-1',
    title: 'Test Task',
    description: 'Test Description',
    subject: {
      student: {
        studentId: 'user-1'
      }
    }
  };

  const mockPromodoroSession = {
    session_id: 'session-1',
    duration_min: 25,
    break_time: 5,
    breaks_taken: 0,
    completed: false,
    task: mockTask,
    start_session: new Date(),
    end_session: null,
  };

  const mockPromodoroRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
  };

  const mockTaskRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromodoroService,
        {
          provide: getRepositoryToken(PromodoroSession),
          useValue: mockPromodoroRepository,
        },
        {
          provide: getRepositoryToken(Task),
          useValue: mockTaskRepository,
        },
      ],
    }).compile();

    service = module.get<PromodoroService>(PromodoroService);
    promodoroRepository = module.get<Repository<PromodoroSession>>(getRepositoryToken(PromodoroSession));
    taskRepository = module.get<Repository<Task>>(getRepositoryToken(Task));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debería crear una sesión de promodoro exitosamente', async () => {
      const createPromodoroDto: CreatePromodoroSessionDto = {
        taskId: 'task-1',
        duration_min: 25,
        break_time: 5,
        completed: false,
      };

      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockPromodoroRepository.create.mockReturnValue(mockPromodoroSession);
      mockPromodoroRepository.save.mockResolvedValue(mockPromodoroSession);

      const result = await service.create(createPromodoroDto);

      expect(mockTaskRepository.findOne).toHaveBeenCalledWith({
        where: { task_id: 'task-1' },
      });
      expect(mockPromodoroRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockPromodoroSession);
    });

    it('debería lanzar NotFoundException si la tarea no existe', async () => {
      const createPromodoroDto: CreatePromodoroSessionDto = {
        taskId: 'nonexistent-task',
        duration_min: 25,
      };

      mockTaskRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createPromodoroDto))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('debería retornar todas las sesiones de un usuario', async () => {
      const sessions = [mockPromodoroSession];
      mockPromodoroRepository.find.mockResolvedValue(sessions);

      const result = await service.findAll('user-1');

      expect(mockPromodoroRepository.find).toHaveBeenCalledWith({
        relations: ['task', 'task.subject', 'task.subject.student'],
        where: {
          task: {
            subject: {
              student: {
                studentId: 'user-1'
              }
            }
          }
        },
        order: { start_session: 'DESC' },
      });
      expect(result).toEqual(sessions);
    });
  });

  describe('findOne', () => {
    it('debería retornar una sesión por ID', async () => {
      mockPromodoroRepository.findOne.mockResolvedValue(mockPromodoroSession);

      const result = await service.findOne('session-1');

      expect(mockPromodoroRepository.findOne).toHaveBeenCalledWith({
        where: { session_id: 'session-1' },
        relations: ['task'],
      });
      expect(result).toEqual(mockPromodoroSession);
    });

    it('debería lanzar NotFoundException si no encuentra la sesión', async () => {
      mockPromodoroRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('findByTask', () => {
    it('debería retornar sesiones por ID de tarea', async () => {
      const sessions = [mockPromodoroSession];
      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockPromodoroRepository.find.mockResolvedValue(sessions);

      const result = await service.findByTask('task-1', 'user-1');

      expect(mockTaskRepository.findOne).toHaveBeenCalledWith({
        where: { task_id: 'task-1' },
        relations: ['subject', 'subject.student'],
      });
      expect(mockPromodoroRepository.find).toHaveBeenCalledWith({
        where: {
          task: {
            task_id: 'task-1'
          }
        },
        relations: ['task'],
        order: { start_session: 'DESC' },
      });
      expect(result).toEqual(sessions);
    });
  });

  describe('update', () => {
    it('debería actualizar una sesión exitosamente', async () => {
      const updatePromodoroDto: UpdatePromodoroSessionDto = {
        completed: true,
        end_session: new Date(),
      };

      const updatedSession = { ...mockPromodoroSession, ...updatePromodoroDto };

      mockPromodoroRepository.findOne.mockResolvedValue(mockPromodoroSession);
      mockPromodoroRepository.save.mockResolvedValue(updatedSession);

      const result = await service.update('session-1', updatePromodoroDto);

      expect(mockPromodoroRepository.findOne).toHaveBeenCalledWith({
        where: { session_id: 'session-1' },
        relations: ['task'],
      });
      expect(result).toEqual(updatedSession);
    });

    it('debería lanzar NotFoundException si no encuentra la sesión', async () => {
      mockPromodoroRepository.findOne.mockResolvedValue(null);

      await expect(service.update('999', { completed: true }))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('debería eliminar una sesión exitosamente', async () => {
      mockPromodoroRepository.findOne.mockResolvedValue(mockPromodoroSession);

      await service.remove('session-1');

      expect(mockPromodoroRepository.findOne).toHaveBeenCalledWith({
        where: { session_id: 'session-1' },
        relations: ['task'],
      });
      expect(mockPromodoroRepository.remove).toHaveBeenCalledWith(mockPromodoroSession);
    });

    it('debería lanzar NotFoundException si no encuentra la sesión', async () => {
      mockPromodoroRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('999'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('getStatsByTask', () => {
    it('debería retornar estadísticas de sesiones por tarea', async () => {
      const sessions = [
        { ...mockPromodoroSession, duration_min: 25, completed: true },
        { ...mockPromodoroSession, duration_min: 20, completed: true },
        { ...mockPromodoroSession, duration_min: 30, completed: false },
      ];

      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockPromodoroRepository.find.mockResolvedValue(sessions);

      const result = await service.getStatsByTask('task-1', 'user-1');

      expect(mockTaskRepository.findOne).toHaveBeenCalledWith({
        where: { task_id: 'task-1' },
        relations: ['subject', 'subject.student'],
      });
      expect(mockPromodoroRepository.find).toHaveBeenCalledWith({
        where: {
          task: {
            task_id: 'task-1'
          }
        },
        relations: ['task'],
        order: { start_session: 'DESC' },
      });
      
      expect(result).toHaveProperty('totalSessions');
      expect(result).toHaveProperty('completedSessions');
      expect(result).toHaveProperty('totalMinutes');
      expect(result).toHaveProperty('totalBreaks');
      expect(result).toHaveProperty('averageMinutesPerSession');
    });
  });
});