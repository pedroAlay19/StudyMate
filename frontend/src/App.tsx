import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { PomodoroProvider } from "./contexts/PomodoroContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Subjects from "./pages/Subjects";
import Tasks from "./pages/Tasks";
import CalendarPage from "./pages/CalendarPage";
import Pomodoro from "./pages/Pomodoro";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <PomodoroProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
  <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          {/* Página de bienvenida (ruta principal) */}
          <Route path="/" element={<Index />} />
          
          {/* Rutas públicas (sin Layout) */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Rutas con Layout (requieren autenticación) */}
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/subjects" element={<Layout><Subjects /></Layout>} />
          <Route path="/tasks" element={<Layout><Tasks /></Layout>} />
          <Route path="/calendar" element={<Layout><CalendarPage /></Layout>} />
          <Route path="/pomodoro" element={<Layout><Pomodoro /></Layout>} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </TooltipProvider>
    </PomodoroProvider>
  </QueryClientProvider>
);

export default App;
