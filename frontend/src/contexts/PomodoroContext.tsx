import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useCreatePomodoroSession, useUpdatePomodoroSession } from '@/hooks/usePomodoro';
import { toast } from 'sonner';

interface PomodoroState {
  minutes: number;
  seconds: number;
  isActive: boolean;
  isBreak: boolean;
  completedPomodoros: number;
  selectedTaskId: string;
  currentSessionId: string | null;
}

interface PomodoroContextType extends PomodoroState {
  setSelectedTaskId: (id: string) => void;
  toggleTimer: () => void;
  resetTimer: () => void;
  formatTime: (mins: number, secs: number) => string;
  progress: number;
}

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined);

const WORK_TIME = 25 * 60;
const BREAK_TIME = 5 * 60;
const STORAGE_KEY = 'pomodoro_state';

export function PomodoroProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PomodoroState>(() => {
    // Intentar recuperar el estado del localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {
          minutes: 25,
          seconds: 0,
          isActive: false,
          isBreak: false,
          completedPomodoros: 0,
          selectedTaskId: '',
          currentSessionId: null,
        };
      }
    }
    return {
      minutes: 25,
      seconds: 0,
      isActive: false,
      isBreak: false,
      completedPomodoros: 0,
      selectedTaskId: '',
      currentSessionId: null,
    };
  });

  const createSession = useCreatePomodoroSession();
  const updateSession = useUpdatePomodoroSession();

  // Guardar estado en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Temporizador
  useEffect(() => {
    let interval: number | null = null;

    if (state.isActive) {
      interval = setInterval(() => {
        setState((prev) => {
          if (prev.seconds === 0) {
            if (prev.minutes === 0) {
              // Timer finished
              if (!prev.isBreak) {
                // Completar sesión de trabajo
                if (prev.currentSessionId) {
                  updateSession.mutate({
                    id: prev.currentSessionId,
                    data: {
                      end_session: new Date().toISOString(),
                      completed: true,
                    },
                  });
                }
                toast.success('¡Pomodoro completado! Toma un descanso');
                return {
                  ...prev,
                  isActive: false,
                  isBreak: true,
                  minutes: 5,
                  seconds: 0,
                  completedPomodoros: prev.completedPomodoros + 1,
                  currentSessionId: null,
                };
              } else {
                // Terminar descanso
                toast.info('¡Descanso terminado! Listo para otro Pomodoro');
                return {
                  ...prev,
                  isActive: false,
                  isBreak: false,
                  minutes: 25,
                  seconds: 0,
                };
              }
            } else {
              return {
                ...prev,
                minutes: prev.minutes - 1,
                seconds: 59,
              };
            }
          } else {
            return {
              ...prev,
              seconds: prev.seconds - 1,
            };
          }
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.isActive, updateSession]);

  const toggleTimer = () => {
    if (!state.isActive && !state.isBreak && state.selectedTaskId && !state.currentSessionId) {
      // Iniciar nueva sesión de trabajo
      createSession.mutate(
        {
          taskId: state.selectedTaskId,
          duration_min: 25,
          breaks_taken: 0,
          completed: false,
        },
        {
          onSuccess: (session) => {
            setState((prev) => ({
              ...prev,
              currentSessionId: session.session_id,
              isActive: true,
            }));
          },
        }
      );
    } else if (!state.isActive && !state.isBreak && !state.selectedTaskId) {
      toast.error('Selecciona una tarea antes de iniciar');
    } else {
      setState((prev) => ({ ...prev, isActive: !prev.isActive }));
    }
  };

  const resetTimer = () => {
    if (state.currentSessionId && !state.isBreak) {
      // Cancelar sesión actual
      updateSession.mutate({
        id: state.currentSessionId,
        data: {
          end_session: new Date().toISOString(),
          completed: false,
        },
      });
    }
    setState({
      minutes: 25,
      seconds: 0,
      isActive: false,
      isBreak: false,
      completedPomodoros: state.completedPomodoros,
      selectedTaskId: '',
      currentSessionId: null,
    });
  };

  const setSelectedTaskId = (id: string) => {
    setState((prev) => ({ ...prev, selectedTaskId: id }));
  };

  const formatTime = (mins: number, secs: number) => {
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalSeconds = state.isBreak ? BREAK_TIME : WORK_TIME;
  const currentSeconds = state.minutes * 60 + state.seconds;
  const progress = ((totalSeconds - currentSeconds) / totalSeconds) * 100;

  return (
    <PomodoroContext.Provider
      value={{
        ...state,
        setSelectedTaskId,
        toggleTimer,
        resetTimer,
        formatTime,
        progress,
      }}
    >
      {children}
    </PomodoroContext.Provider>
  );
}

export function usePomodoro() {
  const context = useContext(PomodoroContext);
  if (!context) {
    throw new Error('usePomodoro must be used within PomodoroProvider');
  }
  return context;
}
