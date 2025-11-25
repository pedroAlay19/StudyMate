import { api } from '@/lib/api';

export interface Alert {
  alertId: string;
  alertDate: string;
  message: string;
  created_at: string;
  task: {
    task_id: string;
    title: string;
    delivery_date: string;
    subject?: {
      name: string;
      color: string;
    };
  };
}

export const alertsService = {
  async getAlerts(): Promise<Alert[]> {
    const response = await api.get('/alerts');
    return response.data;
  },

  async generateAlerts(): Promise<void> {
    await api.post('/alerts/generate');
  },
};
