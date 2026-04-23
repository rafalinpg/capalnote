import { useState, useEffect, useCallback } from 'react';
import { Tag } from '../types';
import { useAuth } from './useAuth';
import { API_URL } from '../lib/api';

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const forceLogout = () => {
    sessionStorage.setItem("auth_reason", "expired");
    window.dispatchEvent(new Event('capalnote:logout'));
  };

  const fetchTags = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/tags/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        forceLogout();
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      if (!response.ok) {
        throw new Error('Falha ao carregar etiquetas');
      }

      const data = await response.json();
      // Backend returns id as number, frontend expects string
      const mappedTags = data.map((t: { id: number; name: string; color: string }) => ({
        ...t,
        id: String(t.id),
      }));
      setTags(mappedTags);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const createTag = async (name: string, color: string = '#6366f1') => {
    if (!token) return;
    
    const response = await fetch(`${API_URL}/tags/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, color }),
    });

    if (response.status === 401) {
      forceLogout();
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    if (!response.ok) {
      throw new Error('Falha ao criar etiqueta');
    }

    const newTag = await response.json();
    const mappedTag = { ...newTag, id: String(newTag.id) };
    setTags(prev => [...prev, mappedTag]);
    return mappedTag;
  };

  const updateTag = async (id: string, data: Partial<Tag>) => {
    if (!token) return;
    
    const response = await fetch(`${API_URL}/tags/${id}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (response.status === 401) {
      forceLogout();
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    if (!response.ok) {
      throw new Error('Falha ao atualizar etiqueta');
    }

    const updatedTag = await response.json();
    const mappedTag = { ...updatedTag, id: String(updatedTag.id) };
    setTags(prev => prev.map(t => t.id === id ? mappedTag : t));
    return mappedTag;
  };

  const deleteTag = async (id: string) => {
    if (!token) return;
    
    const response = await fetch(`${API_URL}/tags/${id}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      forceLogout();
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    if (!response.ok) {
      throw new Error('Falha ao excluir etiqueta');
    }

    setTags(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  return {
    tags,
    loading,
    error,
    createTag,
    updateTag,
    deleteTag,
    refresh: fetchTags,
  };
}
