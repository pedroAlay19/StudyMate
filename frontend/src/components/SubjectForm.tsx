import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Subject, CreateSubjectDto, ScheduleItem } from '@/services/subjects.service';
import { Plus, X } from 'lucide-react';

interface SubjectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateSubjectDto) => void;
  subject?: Subject;
  isLoading?: boolean;
}

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#8B5CF6', // purple
  '#F59E0B', // orange
  '#EF4444', // red
  '#06B6D4', // cyan
  '#EC4899', // pink
  '#6366F1', // indigo
];

export function SubjectForm({ open, onOpenChange, onSubmit, subject, isLoading }: SubjectFormProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CreateSubjectDto>({
    defaultValues: subject || {
      name: '',
      assignedTeacher: '',
      schedule: [],
      color: COLORS[0],
    },
  });

  const [schedules, setSchedules] = useState<ScheduleItem[]>(subject?.schedule || []);
  const selectedColor = watch('color');

  const addSchedule = () => {
    setSchedules([...schedules, { day: 'Lunes', start: '08:00', end: '10:00' }]);
  };

  const removeSchedule = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  const updateSchedule = (index: number, field: keyof ScheduleItem, value: string) => {
    const newSchedules = [...schedules];
    newSchedules[index] = { ...newSchedules[index], [field]: value };
    setSchedules(newSchedules);
  };

  const onFormSubmit = (data: CreateSubjectDto) => {
    onSubmit({ ...data, schedule: schedules });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{subject ? 'Editar Materia' : 'Nueva Materia'}</DialogTitle>
          <DialogDescription>
            {subject ? 'Modifica los datos de la materia' : 'Completa los datos para crear una nueva materia'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la Materia</Label>
            <Input
              id="name"
              {...register('name', { required: 'El nombre es requerido' })}
              placeholder="Ej: Cálculo Diferencial"
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          {/* Profesor */}
          <div className="space-y-2">
            <Label htmlFor="assignedTeacher">Profesor</Label>
            <Input
              id="assignedTeacher"
              {...register('assignedTeacher', { required: 'El profesor es requerido' })}
              placeholder="Ej: Dr. García"
            />
            {errors.assignedTeacher && (
              <p className="text-sm text-destructive">{errors.assignedTeacher.message}</p>
            )}
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label>Color de Identificación</Label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setValue('color', color)}
                  className={`w-10 h-10 rounded-lg transition-all ${
                    selectedColor === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <input type="hidden" {...register('color', { required: true })} />
          </div>

          {/* Horarios */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Horarios</Label>
              <Button type="button" variant="outline" size="sm" onClick={addSchedule}>
                <Plus className="w-4 h-4 mr-1" />
                Agregar Horario
              </Button>
            </div>

            {schedules.length === 0 && (
              <p className="text-sm text-muted-foreground">No hay horarios agregados</p>
            )}

            <div className="space-y-2">
              {schedules.map((schedule, index) => (
                <div key={index} className="flex gap-2 items-center p-3 border rounded-lg">
                  <select
                    value={schedule.day}
                    onChange={(e) => updateSchedule(index, 'day', e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-md bg-background"
                  >
                    {DAYS.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="time"
                    value={schedule.start}
                    onChange={(e) => updateSchedule(index, 'start', e.target.value)}
                    className="w-32"
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input
                    type="time"
                    value={schedule.end}
                    onChange={(e) => updateSchedule(index, 'end', e.target.value)}
                    className="w-32"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSchedule(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Guardando...' : subject ? 'Actualizar' : 'Crear Materia'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
