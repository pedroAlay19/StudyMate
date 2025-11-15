import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Calendar, AlertCircle, Pencil, Trash2, CheckCircle2, Clock } from "lucide-react";
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from "@/hooks/useTasks";
import { TaskForm } from "@/components/TaskForm";
import type { Task, CreateTaskDto, TaskState } from "@/services/tasks.service";
import { TaskState as TaskStateEnum, TaskPriority as TaskPriorityEnum } from "@/services/tasks.service";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Tasks() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<string>("all");

  const { data: tasks = [], isLoading } = useTasks();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const handleCreate = (data: CreateTaskDto) => {
    createTask.mutate(data, {
      onSuccess: () => {
        setFormOpen(false);
      },
    });
  };

  const handleUpdate = (data: CreateTaskDto) => {
    if (editingTask) {
      updateTask.mutate(
        { id: editingTask.task_id, data },
        {
          onSuccess: () => {
            setFormOpen(false);
            setEditingTask(undefined);
          },
        }
      );
    }
  };

  const handleDelete = () => {
    if (taskToDelete) {
      deleteTask.mutate(taskToDelete, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setTaskToDelete(null);
        },
      });
    }
  };

  const handleToggleComplete = (task: Task) => {
    const newState = task.state === TaskStateEnum.COMPLETED 
      ? TaskStateEnum.PENDING 
      : TaskStateEnum.COMPLETED;
    
    updateTask.mutate({
      id: task.task_id,
      data: { state: newState },
    });
  };

  const openEditForm = (task: Task) => {
    setEditingTask(task);
    setFormOpen(true);
  };

  const openDeleteDialog = (taskId: string) => {
    setTaskToDelete(taskId);
    setDeleteDialogOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingTask(undefined);
  };

  // Filtrar tareas según el tab activo
  const filteredTasks = tasks.filter((task) => {
    if (currentTab === "all") return true;
    if (currentTab === "pending") return task.state === TaskStateEnum.PENDING;
    if (currentTab === "in_progress") return task.state === TaskStateEnum.IN_PROGRESS;
    if (currentTab === "completed") return task.state === TaskStateEnum.COMPLETED;
    return true;
  });

  const priorityColors: Record<string, string> = {
    [TaskPriorityEnum.LOW]: "secondary",
    [TaskPriorityEnum.MEDIUM]: "default",
    [TaskPriorityEnum.HIGH]: "default",
    [TaskPriorityEnum.URGENT]: "destructive",
  };

  const priorityLabels: Record<string, string> = {
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

  const TaskCard = ({ task }: { task: Task }) => {
    const daysUntil = Math.ceil(
      (new Date(task.delivery_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    const isOverdue = daysUntil < 0;
    const isDueSoon = daysUntil <= 3 && daysUntil >= 0;
    const isCompleted = task.state === TaskStateEnum.COMPLETED;

    return (
      <Card className="border-0 shadow-md hover:shadow-lg transition-all group">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <Checkbox
              checked={isCompleted}
              onCheckedChange={() => handleToggleComplete(task)}
              className="mt-1"
            />
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3
                  className={`font-semibold text-foreground ${
                    isCompleted ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {task.title}
                </h3>
                <div className="flex items-center gap-1">
                  <Badge variant={priorityColors[task.priority] as any}>
                    {priorityLabels[task.priority]}
                  </Badge>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openEditForm(task)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => openDeleteDialog(task.task_id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">{task.description}</p>

              <div className="flex items-center gap-4 flex-wrap">
                {task.subject && (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: task.subject.color }}
                    />
                    <span className="text-sm text-muted-foreground">{task.subject.name}</span>
                  </div>
                )}

                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{stateLabels[task.state]}</span>
                </div>

                <div
                  className={`flex items-center gap-1 text-sm ${
                    isOverdue
                      ? "text-destructive"
                      : isDueSoon
                      ? "text-orange-600"
                      : "text-muted-foreground"
                  }`}
                >
                  {(isOverdue || isDueSoon) && <AlertCircle className="w-4 h-4" />}
                  <Calendar className="w-4 h-4" />
                  <span>
                    {isOverdue
                      ? `Vencida hace ${Math.abs(daysUntil)} días`
                      : isDueSoon
                      ? `Vence en ${daysUntil} días`
                      : new Date(task.delivery_date).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                        })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando tareas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Mis Tareas</h1>
          <p className="text-muted-foreground">Organiza y monitorea tus tareas académicas</p>
        </div>
        <Button className="shadow-md" onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Tarea
        </Button>
      </div>

      {tasks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CheckCircle2 className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No tienes tareas registradas</h3>
            <p className="text-muted-foreground mb-4">Comienza agregando tu primera tarea</p>
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Primera Tarea
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="all">
              Todas ({tasks.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pendientes ({tasks.filter((t) => t.state === TaskStateEnum.PENDING).length})
            </TabsTrigger>
            <TabsTrigger value="in_progress">
              En Progreso ({tasks.filter((t) => t.state === TaskStateEnum.IN_PROGRESS).length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completadas ({tasks.filter((t) => t.state === TaskStateEnum.COMPLETED).length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={currentTab} className="space-y-4 mt-6">
            {filteredTasks.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground">
                    No hay tareas en esta categoría
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredTasks.map((task) => <TaskCard key={task.task_id} task={task} />)
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Formulario */}
      <TaskForm
        open={formOpen}
        onOpenChange={closeForm}
        onSubmit={editingTask ? handleUpdate : handleCreate}
        task={editingTask}
        isLoading={createTask.isPending || updateTask.isPending}
      />

      {/* Dialog de confirmación para eliminar */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la tarea permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTask.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
