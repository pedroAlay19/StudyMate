import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskState, TaskPriority } from './entities/task.entity';

describe('TasksController', () => {
  let controller: TasksController;
  let service: TasksService;

  const mockUser = {
    sub: 'student-1',
    email: 'john@example.com',
  } as any;

  const mockTask = {
    task_id: 'task-1',
    title: 'Complete homework',
    description: 'Math exercises',
    start_date: new Date('2024-12-01'),
    delivery_date: new Date('2024-12-31'),
    priority: TaskPriority.HIGH,
    state: TaskState.PENDING,
    subjectId: 'subject-1',
  };

  const mockTasksService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findBySubject: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: mockTasksService,
        },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
    service = module.get<TasksService>(TasksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new task', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'Complete homework',
        description: 'Math exercises',
        start_date: new Date('2024-12-01'),
        delivery_date: new Date('2024-12-31'),
        priority: TaskPriority.HIGH,
        state: TaskState.PENDING,
        subjectId: 'subject-1',
      };

      mockTasksService.create.mockResolvedValue(mockTask);

      const result = await controller.create(createTaskDto);

      expect(result).toEqual(mockTask);
      expect(service.create).toHaveBeenCalledWith(createTaskDto);
      expect(service.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('should return an array of tasks', async () => {
      const tasks = [mockTask];
      mockTasksService.findAll.mockResolvedValue(tasks);

      const result = await controller.findAll(mockUser);

      expect(result).toEqual(tasks);
      expect(service.findAll).toHaveBeenCalledWith(mockUser);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return an empty array when no tasks exist', async () => {
      mockTasksService.findAll.mockResolvedValue([]);

      const result = await controller.findAll(mockUser);

      expect(result).toEqual([]);
      expect(service.findAll).toHaveBeenCalledWith(mockUser);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findBySubject', () => {
    it('should return tasks filtered by subject', async () => {
      const subjectId = 'subject-1';
      const tasks = [mockTask];
      mockTasksService.findBySubject.mockResolvedValue(tasks);

      const result = await controller.findBySubject(subjectId);

      expect(result).toEqual(tasks);
      expect(service.findBySubject).toHaveBeenCalledWith(subjectId);
      expect(service.findBySubject).toHaveBeenCalledTimes(1);
    });

    it('should return an empty array when subject has no tasks', async () => {
      const subjectId = 'subject-2';
      mockTasksService.findBySubject.mockResolvedValue([]);

      const result = await controller.findBySubject(subjectId);

      expect(result).toEqual([]);
      expect(service.findBySubject).toHaveBeenCalledWith(subjectId);
      expect(service.findBySubject).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a task by id', async () => {
      const taskId = 'task-1';
      mockTasksService.findOne.mockResolvedValue(mockTask);

      const result = await controller.findOne(taskId);

      expect(result).toEqual(mockTask);
      expect(service.findOne).toHaveBeenCalledWith(taskId);
      expect(service.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      const taskId = 'task-1';
      const updateTaskDto: UpdateTaskDto = {
        title: 'Updated homework',
        state: TaskState.COMPLETED,
      };
      const updatedTask = { ...mockTask, ...updateTaskDto };

      mockTasksService.update.mockResolvedValue(updatedTask);

      const result = await controller.update(taskId, updateTaskDto);

      expect(result).toEqual(updatedTask);
      expect(service.update).toHaveBeenCalledWith(taskId, updateTaskDto);
      expect(service.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove', () => {
    it('should remove a task', async () => {
      const taskId = 'task-1';
      mockTasksService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(taskId);

      expect(result).toBeUndefined();
      expect(service.remove).toHaveBeenCalledWith(taskId);
      expect(service.remove).toHaveBeenCalledTimes(1);
    });
  });
});
