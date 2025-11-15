import { api } from '@/lib/api';

// Interfaces
export interface PomodoroSession {
  session_id: string;
  start_session: string;
  end_session: string | null;
  duration_min: number;
  breaks_taken: number;
  completed: boolean;
  task: {
    task_id: string;
    title: string;
  };
}

export interface CreatePomodoroSessionDto {
  taskId: string;
  duration_min?: number;
  breaks_taken?: number;
  completed?: boolean;
}

export interface UpdatePomodoroSessionDto {
  end_session?: string;
  breaks_taken?: number;
  completed?: boolean;
}

// Servicio API
export const pomodoroService = {
  async getAll(): Promise<PomodoroSession[]> {
    const response = await api.get('/pomodoro-sessions');
    return response.data;
  },

  async getOne(id: string): Promise<PomodoroSession> {
    const response = await api.get(`/pomodoro-sessions/${id}`);
    return response.data;
  },

  async create(data: CreatePomodoroSessionDto): Promise<PomodoroSession> {
    const response = await api.post('/pomodoro-sessions', data);
    return response.data;
  },

  async update(id: string, data: UpdatePomodoroSessionDto): Promise<PomodoroSession> {
    const response = await api.patch(`/pomodoro-sessions/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/pomodoro-sessions/${id}`);
  },
};
