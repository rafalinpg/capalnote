import { useState, useEffect, useCallback } from 'react';
import { Notebook } from '../types';
import { useAuth } from './useAuth';
import { API_URL } from '@/lib/api';

interface NotebookBackend {
  id: number;
  name: string;
  description: string;
  owner: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  note_count: number;
  user_role?: 'owner' | 'full_access' | 'editor' | 'viewer';
}

const mapToFrontend = (data: NotebookBackend): Notebook => ({
  id: String(data.id),
  name: data.name,
  description: data.description,
  ownerId: data.owner, // Backend sends username
  isArchived: data.is_archived,
  noteCount: data.note_count,
  userRole: data.user_role,
  createdAt: new Date(data.created_at),
  updatedAt: new Date(data.updated_at),
});

export function useNotebooks() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const fetchNotebooks = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/notebooks/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Falha ao carregar cadernos');
      }

      const data: NotebookBackend[] = await response.json();
      setNotebooks(data.map(mapToFrontend));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const createNotebook = async (name: string, description: string = '') => {
    if (!token) return;
    
    const response = await fetch(`${API_URL}/notebooks/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, description }),
    });

    if (!response.ok) {
      throw new Error('Falha ao criar caderno');
    }

    const newNotebook: NotebookBackend = await response.json();
    const mapped = mapToFrontend(newNotebook);
    setNotebooks(prev => [mapped, ...prev]);
    return mapped;
  };

  const updateNotebook = async (id: string, data: Partial<Notebook>) => {
    if (!token) return;
    
    // Map frontend camelCase to backend snake_case
    const backendData: Record<string, unknown> = {};
    if (data.name) backendData.name = data.name;
    if (data.description) backendData.description = data.description;
    if (data.isArchived !== undefined) backendData.is_archived = data.isArchived;

    const response = await fetch(`${API_URL}/notebooks/${id}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendData),
    });

    if (!response.ok) {
      throw new Error('Falha ao atualizar caderno');
    }

    const updatedNotebook: NotebookBackend = await response.json();
    const mapped = mapToFrontend(updatedNotebook);
    setNotebooks(prev => prev.map(nb => nb.id === id ? mapped : nb));
    return mapped;
  };

  const deleteNotebook = async (id: string) => {
    if (!token) return;
    
    const response = await fetch(`${API_URL}/notebooks/${id}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Falha ao excluir caderno');
    }

    setNotebooks(prev => prev.filter(nb => nb.id !== id));
  };

  useEffect(() => {
    fetchNotebooks();
  }, [fetchNotebooks]);

  return {
    notebooks,
    loading,
    error,
    createNotebook,
    updateNotebook,
    deleteNotebook,
    refresh: fetchNotebooks,
  };
}
