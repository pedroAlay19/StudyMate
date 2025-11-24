import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { AlertCircle, Calendar as CalendarIcon, Clock, Filter } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { useSubjects } from "@/hooks/useSubjects";
import { TaskState as TaskStateEnum, TaskPriority as TaskPriorityEnum } from "@/services/tasks.service";
import type { Task } from "@/services/tasks.service";
import { format, isSameDay } from "date-fns";

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: tasks = [], isLoading: loadingTasks } = useTasks();
  const { data: subjects = [], isLoading: loadingSubjects } = useSubjects();

  // Función para parsear fecha en zona horaria local (evita problema de UTC)
  const parseLocalDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Filtrar tareas
  const filteredTasks = tasks.filter((task) => {
    if (task.state === TaskStateEnum.COMPLETED || task.state === TaskStateEnum.CANCELLED) {
      return false;
    }
    if (selectedSubject !== "all" && task.subjectId !== selectedSubject) {
      return false;
    }
    return true;
  });

  // Tareas del día seleccionado
  const tasksForSelectedDate = date
    ? filteredTasks.filter((task) =>
        isSameDay(new Date(task.delivery_date), date)
      )
    : [];

  // Próximas tareas (ordenadas por fecha)
  const upcomingTasks = filteredTasks
    .sort((a, b) => new Date(a.delivery_date).getTime() - new Date(b.delivery_date).getTime())
    .slice(0, 8);

  const priorityColors: Record<string, string> = {
    [TaskPriorityEnum.LOW]: "#10b981",
    [TaskPriorityEnum.MEDIUM]: "#f59e0b",
    [TaskPriorityEnum.HIGH]: "#ef4444",
  };

  const priorityLabels: Record<string, string> = {
    [TaskPriorityEnum.LOW]: "Baja",
    [TaskPriorityEnum.MEDIUM]: "Media",
    [TaskPriorityEnum.HIGH]: "Alta",
  };

  const getDaysUntil = (dateStr: string) => {
    const days = Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (days < 0) return "Vencida";
    if (days === 0) return "Hoy";
    if (days === 1) return "Mañana";
    return `${days} días`;
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setDialogOpen(true);
  };

  if (loadingTasks || loadingSubjects) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando calendario...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Calendario Académico</h1>
          <p className="text-muted-foreground">Visualiza todas tus fechas de entrega</p>
        </div>

        {/* Filtro por materia */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={selectedSubject} onValueChange={(value: string) => setSelectedSubject(value)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por materia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las materias</SelectItem>
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
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tareas del día seleccionado */}
        <Card className="lg:col-span-2 border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" />
                Tareas del día
              </span>
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                <input
                  type="date"
                  value={date ? format(date, "yyyy-MM-dd") : ""}
                  onChange={(e) => setDate(e.target.value ? parseLocalDate(e.target.value) : undefined)}
                  className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {tasksForSelectedDate.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CalendarIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">No hay tareas para este día</p>
                  <p className="text-sm mt-1">Selecciona otra fecha para ver las tareas</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tasksForSelectedDate.map((task) => (
                    <div
                      key={task.task_id}
                      onClick={() => handleTaskClick(task)}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted cursor-pointer hover:bg-muted/80 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {task.subject && (
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: task.subject.color }}
                          />
                        )}
                        <div>
                          <p className="font-medium">{task.title}</p>
                          <p className="text-sm text-muted-foreground">{task.subject?.name}</p>
                        </div>
                      </div>
                      <Badge 
                        variant="outline"
                        style={{ 
                          backgroundColor: `${priorityColors[task.priority]}15`,
                          borderColor: priorityColors[task.priority],
                          color: priorityColors[task.priority]
                        }}
                      >
                        {priorityLabels[task.priority]}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-warning" />
              Próximas Entregas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay tareas pendientes</p>
              </div>
            ) : (
              upcomingTasks.map((task) => {
                const daysUntil = getDaysUntil(task.delivery_date);
                const isOverdue = daysUntil === "Vencida";

                return (
                  <div
                    key={task.task_id}
                    onClick={() => handleTaskClick(task)}
                    className="flex items-start justify-between p-3 rounded-lg bg-muted hover:bg-muted/80 cursor-pointer transition-colors"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        {task.subject && (
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: task.subject.color }}
                          />
                        )}
                        <p className="font-medium text-sm">{task.title}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {task.subject?.name}
                      </p>
                    </div>
                    <Badge
                      variant={isOverdue ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {daysUntil}
                    </Badge>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de detalles de tarea */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTask?.subject && (
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: selectedTask.subject.color }}
                />
              )}
              {selectedTask?.title}
            </DialogTitle>
            <DialogDescription>{selectedTask?.description}</DialogDescription>
          </DialogHeader>

          {selectedTask && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Materia</p>
                  <p className="text-sm">{selectedTask.subject?.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Prioridad</p>
                  <Badge 
                    variant="outline"
                    style={{ 
                      backgroundColor: `${priorityColors[selectedTask.priority]}15`,
                      borderColor: priorityColors[selectedTask.priority],
                      color: priorityColors[selectedTask.priority]
                    }}
                  >
                    {priorityLabels[selectedTask.priority]}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fecha de inicio</p>
                  <p className="text-sm flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(new Date(selectedTask.start_date), "MMMM d, yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fecha de entrega</p>
                  <p className="text-sm flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3" />
                    {format(new Date(selectedTask.delivery_date), "MMMM d, yyyy")}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Tiempo restante
                </p>
                <p className="text-lg font-bold text-primary">
                  {getDaysUntil(selectedTask.delivery_date)}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
