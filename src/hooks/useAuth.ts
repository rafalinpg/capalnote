import { useState, useEffect } from 'react';
import { User } from '@/types';

const TEST_USER: User = {
  id: 'test-user-1',
  email: 'teste@capal.com.br',
  name: 'Usuário Teste',
  avatar: undefined,
};

const TEST_CREDENTIALS = {
  email: 'teste@capal.com.br',
  password: '123456',
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('capalnote_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (email === TEST_CREDENTIALS.email && password === TEST_CREDENTIALS.password) {
      setUser(TEST_USER);
      localStorage.setItem('capalnote_user', JSON.stringify(TEST_USER));
      return { success: true };
    }
    return { success: false, error: 'Email ou senha inválidos' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('capalnote_user');
  };

  return { user, isLoading, login, logout };
};
