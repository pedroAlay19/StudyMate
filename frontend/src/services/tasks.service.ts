import { api } from '@/lib/api';

// Enums como constantes
export const TaskState = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type TaskState = typeof TaskState[keyof typeof TaskState];

export const TaskPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export type TaskPriority = typeof TaskPriority[keyof typeof TaskPriority];

// Interfaces
export interface Task {
  task_id: string;
  title: string;
  description: string;
  start_date: string;
  delivery_date: string;
  priority: TaskPriority;
  state: TaskState;
  subjectId: string;
  subject?: {
    subjectId: string;
    name: string;
    color: string;
  };
}

export interface CreateTaskDto {
  subjectId: string;
  title: string;
  description: string;
  start_date: string;
  delivery_date: string;
  priority: TaskPriority;
  state: TaskState;
}

export interface UpdateTaskDto extends Partial<CreateTaskDto> {}

// Servicio API
export const tasksService = {
  async getAll(): Promise<Task[]> {
    const response = await api.get('/tasks');
    return response.data;
  },

  async getOne(id: string): Promise<Task> {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  async create(data: CreateTaskDto): Promise<Task> {
    const response = await api.post('/tasks', data);
    return response.data;
  },

  async update(id: string, data: UpdateTaskDto): Promise<Task> {
    const response = await api.patch(`/tasks/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/tasks/${id}`);
  },
};
