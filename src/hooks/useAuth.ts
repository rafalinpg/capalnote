import { useState, useEffect } from 'react';
import { User } from '@/types';

const API_URL = `http://${window.location.hostname}:8000/api`;

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'));

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  };

  const fetchUser = async (authToken: string) => {
    try {
      const response = await fetch(`${API_URL}/me/`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser({
          id: userData.id,
          email: userData.email,
          name: userData.name,
          avatar: undefined,
        });
      } else {
        // Token inválido
        logout();
      }
    } catch (error) {
      console.error("Erro ao buscar usuário", error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    if (storedToken) {
      setToken(storedToken);
      fetchUser(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_URL}/token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: email, password }), // DRF espera 'username' por padrão, mas pode ser email dependendo da config. O padrão é username.
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        setToken(data.access);
        await fetchUser(data.access);
        return { success: true };
      } else {
        return { success: false, error: data.detail || 'Falha na autenticação' };
      }
    } catch (error) {
      return { success: false, error: 'Erro de conexão com o servidor' };
    }
  };

  return { user, isLoading, login, logout, token };
};
