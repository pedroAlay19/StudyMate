import { api } from '@/lib/api';

export interface ScheduleItem {
  day: string;
  start: string;
  end: string;
}

export interface Subject {
  subjectId: string;
  name: string;
  assignedTeacher: string;
  schedule: ScheduleItem[];
  color: string;
}

export interface CreateSubjectDto {
  name: string;
  assignedTeacher: string;
  schedule: ScheduleItem[];
  color: string;
}

export interface UpdateSubjectDto {
  name?: string;
  assignedTeacher?: string;
  schedule?: ScheduleItem[];
  color?: string;
}

export const subjectsService = {
  getAll: async (): Promise<Subject[]> => {
    const { data } = await api.get('/subjects');
    return data;
  },

  getOne: async (id: string): Promise<Subject> => {
    const { data } = await api.get(`/subjects/${id}`);
    return data;
  },

  create: async (subjectData: CreateSubjectDto): Promise<Subject> => {
    const { data } = await api.post('/subjects', subjectData);
    return data;
  },

  update: async (id: string, subjectData: UpdateSubjectDto): Promise<Subject> => {
    const { data } = await api.patch(`/subjects/${id}`, subjectData);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/subjects/${id}`);
  },
};
