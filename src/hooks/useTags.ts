import { useState, useEffect, useCallback } from 'react';
import { Tag } from '../types';
import { useAuth } from './useAuth';

const API_URL = `http://${window.location.hostname}:8000/api`;

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

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

      if (!response.ok) {
        throw new Error('Falha ao carregar etiquetas');
      }

      const data = await response.json();
      // Backend returns id as number, frontend expects string
      const mappedTags = data.map((t: any) => ({
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
    try {
      const response = await fetch(`${API_URL}/tags/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, color }),
      });

      if (!response.ok) {
        throw new Error('Falha ao criar etiqueta');
      }

      const newTag = await response.json();
      const mappedTag = { ...newTag, id: String(newTag.id) };
      setTags(prev => [...prev, mappedTag]);
      return mappedTag;
    } catch (err) {
      throw err;
    }
  };

  const updateTag = async (id: string, data: Partial<Tag>) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/tags/${id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Falha ao atualizar etiqueta');
      }

      const updatedTag = await response.json();
      const mappedTag = { ...updatedTag, id: String(updatedTag.id) };
      setTags(prev => prev.map(t => t.id === id ? mappedTag : t));
      return mappedTag;
    } catch (err) {
      throw err;
    }
  };

  const deleteTag = async (id: string) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/tags/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Falha ao excluir etiqueta');
      }

      setTags(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      throw err;
    }
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
