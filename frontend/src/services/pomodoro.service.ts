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
  async getAllSessions(): Promise<PomodoroSession[]> {
    const response = await api.get('/pomodoro');
    return response.data;
  },

  async getSessionById(id: string): Promise<PomodoroSession> {
    const response = await api.get(`/pomodoro/${id}`);
    return response.data;
  },

  async createSession(data: CreatePomodoroSessionDto): Promise<PomodoroSession> {
    const response = await api.post('/pomodoro', data);
    return response.data;
  },

  async updateSession(id: string, data: UpdatePomodoroSessionDto): Promise<PomodoroSession> {
    const response = await api.patch(`/pomodoro/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/pomodoro/${id}`);
  },
};
