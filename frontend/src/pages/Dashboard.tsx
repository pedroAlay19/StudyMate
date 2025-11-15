import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  TrendingUp,
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Timer,
  Calendar,
  Target,
} from "lucide-react";
import { useSubjects } from "@/hooks/useSubjects";
import { useTasks } from "@/hooks/useTasks";
import { usePomodoroSessions } from "@/hooks/usePomodoro";
import { TaskState as TaskStateEnum, TaskPriority as TaskPriorityEnum } from "@/services/tasks.service";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { data: subjects = [], isLoading: loadingSubjects } = useSubjects();
  const { data: tasks = [], isLoading: loadingTasks } = useTasks();
  const { data: sessions = [], isLoading: loadingSessions } = usePomodoroSessions();

  // Calcular estadísticas
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.state === TaskStateEnum.COMPLETED).length;
  const pendingTasks = tasks.filter((t) => t.state === TaskStateEnum.PENDING).length;
  const inProgressTasks = tasks.filter((t) => t.state === TaskStateEnum.IN_PROGRESS).length;
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Sesiones Pomodoro
  const completedSessions = sessions.filter((s) => s.completed).length;
  const totalMinutes = sessions
    .filter((s) => s.completed)
    .reduce((acc, s) => acc + s.duration_min, 0);

  // Próximas tareas (ordenadas por fecha de entrega)
  const upcomingTasks = tasks
    .filter((t) => t.state !== TaskStateEnum.COMPLETED && t.state !== TaskStateEnum.CANCELLED)
    .sort((a, b) => new Date(a.delivery_date).getTime() - new Date(b.delivery_date).getTime())
    .slice(0, 5);

  // Progreso por materia
  const subjectProgress = subjects.map((subject) => {
    const subjectTasks = tasks.filter((t) => t.subjectId === subject.subjectId);
    const completedCount = subjectTasks.filter((t) => t.state === TaskStateEnum.COMPLETED).length;
    const progress = subjectTasks.length > 0 ? Math.round((completedCount / subjectTasks.length) * 100) : 0;

    return {
      ...subject,
      totalTasks: subjectTasks.length,
      completedTasks: completedCount,
      progress,
    };
  });

  const getDaysUntil = (date: string) => {
    const days = Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (days < 0) return "Vencida";
    if (days === 0) return "Hoy";
    if (days === 1) return "Mañana";
    return `${days} días`;
  };

  const priorityColors: Record<string, string> = {
    [TaskPriorityEnum.LOW]: "secondary",
    [TaskPriorityEnum.MEDIUM]: "default",
    [TaskPriorityEnum.HIGH]: "default",
    [TaskPriorityEnum.URGENT]: "destructive",
  };

  if (loadingSubjects || loadingTasks || loadingSessions) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground text-lg">
          Bienvenido de vuelta! Aquí está tu resumen académico.
        </p>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Materias</p>
                <p className="text-3xl font-bold text-foreground mt-2">{subjects.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tareas Pendientes</p>
                <p className="text-3xl font-bold text-foreground mt-2">{pendingTasks + inProgressTasks}</p>
              </div>
              <div className="p-3 rounded-lg bg-warning/10">
                <Target className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completadas</p>
                <p className="text-3xl font-bold text-foreground mt-2">{completedTasks}</p>
              </div>
              <div className="p-3 rounded-lg bg-success/10">
                <CheckCircle2 className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pomodoros</p>
                <p className="text-3xl font-bold text-foreground mt-2">{completedSessions}</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/10">
                <Timer className="w-6 h-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximas Entregas */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 rounded-lg bg-warning/10">
                <AlertCircle className="w-5 h-5 text-warning" />
              </div>
              Próximas Entregas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay tareas pendientes</p>
              </div>
            ) : (
              <>
                {upcomingTasks.map((task) => {
                  const daysUntil = getDaysUntil(task.delivery_date);
                  const isOverdue = daysUntil === "Vencida";

                  return (
                    <div
                      key={task.task_id}
                      className="flex items-center justify-between p-4 rounded-xl bg-muted cursor-pointer border border-border/50 hover:border-primary/50 transition-colors"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground mb-1">{task.title}</h4>
                        <div className="flex items-center gap-2">
                          {task.subject && (
                            <div className="flex items-center gap-1">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: task.subject.color }}
                              />
                              <p className="text-sm text-muted-foreground">{task.subject.name}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={isOverdue ? "destructive" : priorityColors[task.priority] as any}
                          className="shadow-md"
                        >
                          {daysUntil}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
                <Link to="/tasks">
                  <Button variant="outline" className="w-full">
                    Ver Todas las Tareas
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        {/* Progreso por Materia */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 rounded-lg bg-success/10">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              Progreso por Materia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {subjectProgress.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay materias registradas</p>
              </div>
            ) : (
              <>
                {subjectProgress.slice(0, 5).map((subject) => (
                  <div key={subject.subjectId} className="space-y-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: subject.color }}
                        />
                        <span className="font-semibold text-foreground">{subject.name}</span>
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">
                        {subject.completedTasks}/{subject.totalTasks} tareas
                      </span>
                    </div>
                    <div className="space-y-2">
                      <Progress value={subject.progress} className="h-3 shadow-inner" />
                      <span className="text-xs font-medium text-success">
                        {subject.progress}% completado
                      </span>
                    </div>
                  </div>
                ))}
                <Link to="/subjects">
                  <Button variant="outline" className="w-full">
                    Ver Todas las Materias
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Resumen Pomodoro y Progreso General */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sesiones Pomodoro */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 rounded-lg bg-secondary/10">
                <Timer className="w-5 h-5 text-secondary" />
              </div>
              Resumen Pomodoro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground mb-1">Sesiones Completadas</p>
                <p className="text-2xl font-bold text-foreground">{completedSessions}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground mb-1">Tiempo Total</p>
                <p className="text-2xl font-bold text-foreground">{totalMinutes} min</p>
              </div>
            </div>
            <Link to="/pomodoro">
              <Button variant="outline" className="w-full">
                Ir al Pomodoro
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Progreso General */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 rounded-lg bg-primary/10">
                <Target className="w-5 h-5 text-primary" />
              </div>
              Progreso General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Completadas</span>
                <span className="text-sm font-bold text-success">{completedTasks}</span>
              </div>
              <Progress value={overallProgress} className="h-4" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">En progreso: {inProgressTasks}</span>
                <span className="text-muted-foreground">Pendientes: {pendingTasks}</span>
              </div>
            </div>
            <div className="text-center p-4 rounded-lg bg-primary/5">
              <p className="text-3xl font-bold text-primary">{overallProgress}%</p>
              <p className="text-sm text-muted-foreground mt-1">Progreso total</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
