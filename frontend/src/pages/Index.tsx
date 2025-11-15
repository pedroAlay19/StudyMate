import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Calendar, TrendingUp, Bell, Timer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Si ya hay un token, redirigir al dashboard
    const token = localStorage.getItem('access_token');
    if (token) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const features = [
    {
      icon: BookOpen,
      title: "Organiza tus Materias",
      description: "Registra todas tus materias del semestre en un solo lugar"
    },
    {
      icon: Calendar,
      title: "Calendario Académico",
      description: "Visualiza todas tus entregas en un calendario interactivo"
    },
    {
      icon: Bell,
      title: "Alertas Inteligentes",
      description: "Recibe notificaciones 3 días antes de cada entrega"
    },
    {
      icon: Timer,
      title: "Técnica Pomodoro",
      description: "Sesiones de estudio cronometradas para mejor productividad"
    },
    {
      icon: TrendingUp,
      title: "Priorización de Tareas",
      description: "Organiza tus tareas por urgencia e importancia"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">StudyMate</h1>
              <p className="text-xs text-muted-foreground">Tu organizador académico</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => navigate("/login")}>
              Iniciar Sesión
            </Button>
            <Button onClick={() => navigate("/register")}>
              Registrarse
            </Button>
          </div>
        </div>
      </header>

      {/* Main Hero */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
            Organiza tu vida académica
            <span className="block text-primary mt-2">sin estrés</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            StudyMate te ayuda a gestionar todas tus materias, tareas y proyectos en un solo lugar. 
            Nunca más pierdas una fecha de entrega.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" className="text-lg px-8" onClick={() => navigate("/register")}>
              Comenzar Gratis
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8" onClick={() => navigate("/login")}>
              Iniciar Sesión
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h3 className="text-3xl font-bold text-center mb-12 text-foreground">
            Todo lo que necesitas para triunfar
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {features.slice(0, 3).map((feature, index) => (
              <Card key={index} className="border-border hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="text-lg font-semibold mb-2 text-foreground">{feature.title}</h4>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {features.slice(3, 5).map((feature, index) => (
              <Card key={index + 3} className="border-border hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="text-lg font-semibold mb-2 text-foreground">{feature.title}</h4>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <h3 className="text-4xl font-bold mb-6 text-foreground">
            ¿Listo para mejorar tu rendimiento académico?
          </h3>
          <p className="text-xl text-muted-foreground mb-8">
            Únete a miles de estudiantes que ya organizan su vida académica con StudyMate
          </p>
          <Button size="lg" className="text-lg px-12" onClick={() => navigate("/register")}>
            Crear Cuenta Gratis
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>© 2024 StudyMate. Tu organizador académico de confianza.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
