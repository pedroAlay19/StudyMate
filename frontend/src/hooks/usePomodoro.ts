import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pomodoroService } from '@/services/pomodoro.service';
import type { CreatePomodoroSessionDto, UpdatePomodoroSessionDto } from '@/services/pomodoro.service';
import { toast } from 'sonner';

// Hook para obtener todas las sesiones
export function usePomodoroSessions() {
  return useQuery({
    queryKey: ['pomodoro-sessions'],
    queryFn: pomodoroService.getAll,
  });
}

// Hook para obtener una sesión específica
export function usePomodoroSession(id: string) {
  return useQuery({
    queryKey: ['pomodoro-sessions', id],
    queryFn: () => pomodoroService.getOne(id),
    enabled: !!id,
  });
}

// Hook para crear una sesión
export function useCreatePomodoroSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePomodoroSessionDto) => pomodoroService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pomodoro-sessions'] });
      toast.success('Sesión de Pomodoro iniciada');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al iniciar sesión');
    },
  });
}

// Hook para actualizar una sesión
export function useUpdatePomodoroSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePomodoroSessionDto }) =>
      pomodoroService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pomodoro-sessions'] });
      toast.success('Sesión completada');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar sesión');
    },
  });
}

// Hook para eliminar una sesión
export function useDeletePomodoroSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => pomodoroService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pomodoro-sessions'] });
      toast.success('Sesión eliminada');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar sesión');
    },
  });
}
