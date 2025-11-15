import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Task, CreateTaskDto, TaskState, TaskPriority } from "@/services/tasks.service";
import { TaskState as TaskStateEnum, TaskPriority as TaskPriorityEnum } from "@/services/tasks.service";
import { useSubjects } from "@/hooks/useSubjects";

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateTaskDto) => void;
  task?: Task;
  isLoading?: boolean;
}

export function TaskForm({ open, onOpenChange, onSubmit, task, isLoading }: TaskFormProps) {
  const { data: subjects = [] } = useSubjects();
  
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateTaskDto>({
    defaultValues: {
      title: "",
      description: "",
      subjectId: "",
      start_date: "",
      delivery_date: "",
      priority: TaskPriorityEnum.MEDIUM,
      state: TaskStateEnum.PENDING,
    },
  });

  const selectedSubject = watch("subjectId");
  const selectedPriority = watch("priority");
  const selectedState = watch("state");

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description,
        subjectId: task.subjectId,
        start_date: task.start_date.split('T')[0],
        delivery_date: task.delivery_date.split('T')[0],
        priority: task.priority,
        state: task.state,
      });
    } else {
      reset({
        title: "",
        description: "",
        subjectId: "",
        start_date: new Date().toISOString().split('T')[0],
        delivery_date: new Date().toISOString().split('T')[0],
        priority: TaskPriorityEnum.MEDIUM,
        state: TaskStateEnum.PENDING,
      });
    }
  }, [task, reset]);

  const handleFormSubmit = (data: CreateTaskDto) => {
    onSubmit(data);
  };

  const priorityLabels: Record<TaskPriority, string> = {
    [TaskPriorityEnum.LOW]: "Baja",
    [TaskPriorityEnum.MEDIUM]: "Media",
    [TaskPriorityEnum.HIGH]: "Alta",
    [TaskPriorityEnum.URGENT]: "Urgente",
  };

  const stateLabels: Record<TaskState, string> = {
    [TaskStateEnum.PENDING]: "Pendiente",
    [TaskStateEnum.IN_PROGRESS]: "En Progreso",
    [TaskStateEnum.COMPLETED]: "Completada",
    [TaskStateEnum.CANCELLED]: "Cancelada",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? "Editar Tarea" : "Nueva Tarea"}</DialogTitle>
          <DialogDescription>
            {task ? "Modifica los datos de la tarea" : "Completa los datos para crear una nueva tarea"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Título <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              {...register("title", { required: "El título es requerido" })}
              placeholder="Ej: Entregar proyecto final"
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Descripción <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              {...register("description", { required: "La descripción es requerida" })}
              placeholder="Describe los detalles de la tarea..."
              rows={4}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Materia */}
          <div className="space-y-2">
            <Label htmlFor="subjectId">
              Materia <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedSubject}
              onValueChange={(value: string) => setValue("subjectId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una materia" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.subjectId} value={subject.subjectId}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: subject.color }}
                      />
                      {subject.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.subjectId && (
              <p className="text-sm text-destructive">{errors.subjectId.message}</p>
            )}
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">
                Fecha de Inicio <span className="text-destructive">*</span>
              </Label>
              <Input
                id="start_date"
                type="date"
                {...register("start_date", { required: "La fecha de inicio es requerida" })}
              />
              {errors.start_date && (
                <p className="text-sm text-destructive">{errors.start_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_date">
                Fecha de Entrega <span className="text-destructive">*</span>
              </Label>
              <Input
                id="delivery_date"
                type="date"
                {...register("delivery_date", { required: "La fecha de entrega es requerida" })}
              />
              {errors.delivery_date && (
                <p className="text-sm text-destructive">{errors.delivery_date.message}</p>
              )}
            </div>
          </div>

          {/* Prioridad y Estado */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">
                Prioridad <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedPriority}
                onValueChange={(value: TaskPriority) => setValue("priority", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona prioridad" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(priorityLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.priority && (
                <p className="text-sm text-destructive">{errors.priority.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">
                Estado <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedState}
                onValueChange={(value: TaskState) => setValue("state", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona estado" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(stateLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.state && (
                <p className="text-sm text-destructive">{errors.state.message}</p>
              )}
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : task ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
