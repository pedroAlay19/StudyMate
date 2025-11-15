import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subjectsService } from '@/services/subjects.service';
import type { CreateSubjectDto, UpdateSubjectDto } from '@/services/subjects.service';
import { toast } from 'sonner';

// Hook para obtener todas las materias
export const useSubjects = () => {
  return useQuery({
    queryKey: ['subjects'],
    queryFn: subjectsService.getAll,
  });
};

// Hook para obtener una materia específica
export const useSubject = (id: string) => {
  return useQuery({
    queryKey: ['subjects', id],
    queryFn: () => subjectsService.getOne(id),
    enabled: !!id,
  });
};

// Hook para crear materia
export const useCreateSubject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSubjectDto) => subjectsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast.success('Materia creada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear la materia');
    },
  });
};

// Hook para actualizar materia
export const useUpdateSubject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSubjectDto }) =>
      subjectsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast.success('Materia actualizada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar la materia');
    },
  });
};

// Hook para eliminar materia
export const useDeleteSubject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => subjectsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast.success('Materia eliminada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar la materia');
    },
  });
};
