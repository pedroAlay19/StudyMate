import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Calendar, AlertCircle, CheckCircle } from "lucide-react";
import { useAlerts } from "@/hooks/useAlerts";
import type { Alert } from "@/services/alerts.service";

export function NotificationBell() {
  const [showNotifications, setShowNotifications] = useState(false);
  const { data: alerts = [], isLoading } = useAlerts();

  // Filtrar alertas recientes (últimos 7 días)
  const recentAlerts = alerts.filter((alert) => {
    const alertDate = new Date(alert.alertDate);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - alertDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff <= 7;
  });

  const unreadCount = recentAlerts.length;

  const getDaysUntilDue = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffInMs = due.getTime() - now.getTime();
    const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 0) {
      return { text: `Vencida hace ${Math.abs(diffInDays)} días`, color: 'text-destructive', icon: AlertCircle };
    } else if (diffInDays === 0) {
      return { text: 'Vence hoy', color: 'text-orange-600', icon: AlertCircle };
    } else if (diffInDays === 1) {
      return { text: 'Vence mañana', color: 'text-orange-600', icon: AlertCircle };
    } else if (diffInDays <= 3) {
      return { text: `Vence en ${diffInDays} días`, color: 'text-orange-500', icon: AlertCircle };
    } else {
      return { text: `Vence en ${diffInDays} días`, color: 'text-muted-foreground', icon: CheckCircle };
    }
  };

  const AlertItem = ({ alert }: { alert: Alert }) => {
    const dueInfo = getDaysUntilDue(alert.task.delivery_date);
    const Icon = dueInfo.icon;
    
    // Generar mensaje dinámicamente en español
    const now = new Date();
    const dueDate = new Date(alert.task.delivery_date);
    const diffInDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    let dynamicMessage = '';
    if (diffInDays < 0) {
      dynamicMessage = `La tarea "${alert.task.title}" venció hace ${Math.abs(diffInDays)} ${Math.abs(diffInDays) === 1 ? 'día' : 'días'}.`;
    } else if (diffInDays === 0) {
      dynamicMessage = `La tarea "${alert.task.title}" vence hoy.`;
    } else {
      dynamicMessage = `La tarea "${alert.task.title}" vence en ${diffInDays} ${diffInDays === 1 ? 'día' : 'días'}.`;
    }

    return (
      <div className="p-3 hover:bg-muted/50 transition-colors border-b last:border-b-0">
        <div className="flex items-start gap-3">
          <div className={`mt-1 ${dueInfo.color}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {alert.task.title}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {dynamicMessage}
            </p>
            <div className="flex items-center gap-3 mt-2">
              {alert.task.subject && (
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: alert.task.subject.color }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {alert.task.subject.name}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-muted-foreground" />
                <span className={`text-xs ${dueInfo.color}`}>
                  {dueInfo.text}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative hover:bg-muted rounded-lg"
        onClick={() => setShowNotifications(!showNotifications)}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {showNotifications && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowNotifications(false)}
          />
          <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-card border border-border rounded-lg shadow-xl z-20 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border bg-muted/30">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-base">Notificaciones</h3>
                {unreadCount > 0 && (
                  <Badge variant="secondary">{unreadCount}</Badge>
                )}
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">Cargando...</p>
                </div>
              ) : recentAlerts.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm font-medium text-foreground">
                    No hay notificaciones
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Te avisaremos cuando haya tareas próximas a vencer
                  </p>
                </div>
              ) : (
                <div>
                  {recentAlerts.map((alert) => (
                    <AlertItem key={alert.alertId} alert={alert} />
                  ))}
                </div>
              )}
            </div>

            {recentAlerts.length > 0 && (
              <div className="p-3 border-t border-border bg-muted/30">
                <p className="text-xs text-center text-muted-foreground">
                  Mostrando alertas de los últimos 7 días
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
