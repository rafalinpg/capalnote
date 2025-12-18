import { useState, useEffect, useCallback } from 'react';
import { Note, Tag } from '../types';
import { useAuth } from './useAuth';

const API_URL = `http://${window.location.hostname}:8000/api`;

interface TagBackend {
  id: number;
  name: string;
  color: string;
}

interface NoteBackend {
  id: number;
  notebook: number;
  title: string;
  content_rich: string;
  content_text: string;
  is_pinned: boolean;
  is_archived: boolean;
  is_trashed: boolean;
  author: string;
  last_edited_by: string;
  tags: TagBackend[];
  created_at: string;
  updated_at: string;
}

const mapTagToFrontend = (data: TagBackend): Tag => ({
  id: String(data.id),
  name: data.name,
  color: data.color,
});

const mapToFrontend = (data: NoteBackend): Note => ({
  id: String(data.id),
  notebookId: String(data.notebook),
  title: data.title,
  contentRich: data.content_rich,
  contentText: data.content_text,
  isPinned: data.is_pinned,
  isArchived: data.is_archived,
  isTrashed: data.is_trashed,
  authorId: data.author,
  lastEditedBy: data.last_edited_by,
  tags: data.tags.map(mapTagToFrontend),
  attachments: [], // Backend doesn't return attachments in list yet
  comments: [], // Backend doesn't return comments in list yet
  createdAt: new Date(data.created_at),
  updatedAt: new Date(data.updated_at),
});

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const fetchNotes = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/notes/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Falha ao carregar notas');
      }

      const data: NoteBackend[] = await response.json();
      setNotes(data.map(mapToFrontend));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const createNote = async (notebookId: string, title: string = 'Sem título', contentRich: string = '', contentText: string = '') => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/notes/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notebook: parseInt(notebookId),
          title,
          content_rich: contentRich,
          content_text: contentText,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Create note error response:', errorText);
        throw new Error(`Falha ao criar nota: ${errorText}`);
      }

      const newNote: NoteBackend = await response.json();
      const mapped = mapToFrontend(newNote);
      setNotes(prev => [mapped, ...prev]);
      return mapped;
    } catch (err) {
      throw err;
    }
  };

  const updateNote = async (id: string, data: Partial<Note>) => {
    if (!token) return;
    
    // Map frontend camelCase to backend snake_case
    const backendData: any = {};
    if (data.title !== undefined) backendData.title = data.title;
    if (data.contentRich !== undefined) backendData.content_rich = data.contentRich;
    if (data.contentText !== undefined) backendData.content_text = data.contentText;
    if (data.isPinned !== undefined) backendData.is_pinned = data.isPinned;
    if (data.isArchived !== undefined) backendData.is_archived = data.isArchived;
    if (data.isTrashed !== undefined) backendData.is_trashed = data.isTrashed;
    if (data.notebookId !== undefined) backendData.notebook = parseInt(data.notebookId);
    if (data.tags !== undefined) backendData.tag_ids = data.tags.map(t => parseInt(t.id));

    try {
      const response = await fetch(`${API_URL}/notes/${id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendData),
      });

      if (!response.ok) {
        throw new Error('Falha ao atualizar nota');
      }

      const updatedNote: NoteBackend = await response.json();
      const mapped = mapToFrontend(updatedNote);
      setNotes(prev => prev.map(n => n.id === id ? mapped : n));
      return mapped;
    } catch (err) {
      throw err;
    }
  };

  const deleteNote = async (id: string) => {
    // Soft delete (move to trash)
    return updateNote(id, { isTrashed: true });
  };

  const permanentDeleteNote = async (id: string) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/notes/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Falha ao excluir nota permanentemente');
      }

      setNotes(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      throw err;
    }
  };

  const restoreFromTrash = async (id: string) => {
    return updateNote(id, { isTrashed: false });
  };

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  return {
    notes,
    loading,
    error,
    createNote,
    updateNote,
    deleteNote,
    permanentDeleteNote,
    restoreFromTrash,
    refresh: fetchNotes,
  };
}
