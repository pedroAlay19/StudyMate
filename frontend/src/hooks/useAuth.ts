import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

interface User {
  studentId: string;
  name: string;
  email: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          setUser(null);
          setLoading(false);
          return;
        }

        // SIEMPRE validar con el servidor para asegurar que el token es válido
        const { data } = await api.get('/auth/profile');
        setUser(data);
        // Actualizar localStorage con los datos más recientes
        localStorage.setItem('user', JSON.stringify(data));
      } catch (error) {
        console.error('Error fetching user:', error);
        // Si falla la validación, limpiar todo
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/index');
  };

  return { user, loading, logout };
};
