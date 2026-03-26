import { useState, useEffect, useCallback } from 'react';
import { Note, Tag, Attachment } from '../types';
import { useAuth } from './useAuth';
import { API_URL, getMediaUrl, processHtmlMediaUrls } from '@/lib/api';

interface TagBackend {
  id: number;
  name: string;
  color: string;
}

interface AttachmentBackend {
  id: number;
  note: number;
  type: string;
  file: string;
  file_name: string;
  size_bytes: number;
  mime_type: string;
  created_at: string;
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
  attachments: AttachmentBackend[];
  user_role?: 'owner' | 'full_access' | 'editor' | 'viewer';
  created_at: string;
  updated_at: string;
}

const mapTagToFrontend = (data: TagBackend): Tag => ({
  id: String(data.id),
  name: data.name,
  color: data.color,
});

const mapAttachmentToFrontend = (data: AttachmentBackend): Attachment => ({
  id: String(data.id),
  noteId: String(data.note),
  type: data.type as 'image' | 'audio' | 'file' | 'sketch',
  fileUrl: getMediaUrl(data.file),
  fileName: data.file_name,
  sizeBytes: data.size_bytes,
  mimeType: data.mime_type,
  createdAt: new Date(data.created_at),
});

const mapToFrontend = (data: NoteBackend): Note => ({
  id: String(data.id),
  notebookId: String(data.notebook),
  title: data.title,
  contentRich: processHtmlMediaUrls(data.content_rich),
  contentText: data.content_text,
  isPinned: data.is_pinned,
  isArchived: data.is_archived,
  isTrashed: data.is_trashed,
  authorId: data.author,
  lastEditedBy: data.last_edited_by,
  tags: data.tags.map(mapTagToFrontend),
  attachments: (data.attachments || []).map(mapAttachmentToFrontend),
  comments: [], // Backend doesn't return comments in list yet
  userRole: data.user_role,
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
  };

  const updateNote = async (id: string, data: Partial<Note>) => {
    if (!token) return;
    
    // Find current note to compare changes
    const currentNote = notes.find(n => n.id === id);
    const backendData: Record<string, unknown> = {};

    // Only add fields that have actually changed or if currentNote is not found (fallback)
    
    if (data.title !== undefined && (!currentNote || data.title !== currentNote.title)) {
      backendData.title = data.title;
    }
    
    if (data.contentRich !== undefined && (!currentNote || data.contentRich !== currentNote.contentRich)) {
      backendData.content_rich = data.contentRich;
    }
    
    if (data.contentText !== undefined && (!currentNote || data.contentText !== currentNote.contentText)) {
      backendData.content_text = data.contentText;
    }
    
    if (data.isPinned !== undefined && (!currentNote || data.isPinned !== currentNote.isPinned)) {
      backendData.is_pinned = data.isPinned;
    }
    
    if (data.isArchived !== undefined && (!currentNote || data.isArchived !== currentNote.isArchived)) {
      backendData.is_archived = data.isArchived;
    }
    
    if (data.isTrashed !== undefined && (!currentNote || data.isTrashed !== currentNote.isTrashed)) {
      backendData.is_trashed = data.isTrashed;
    }
    
    if (data.notebookId !== undefined && (!currentNote || data.notebookId !== currentNote.notebookId)) {
      backendData.notebook = parseInt(data.notebookId);
    }
    
    // Check for tag changes
    if (data.tags !== undefined) {
      const currentTagIds = currentNote?.tags.map(t => t.id).sort().join(',') || '';
      const newTagIds = data.tags.map(t => t.id).sort().join(',');
      
      if (!currentNote || currentTagIds !== newTagIds) {
        backendData.tag_ids = data.tags
          .map(t => parseInt(t.id))
          .filter(id => !isNaN(id)); // Filter out any invalid IDs
      }
    }

    // If nothing changed, don't send request
    if (Object.keys(backendData).length === 0) {
      return currentNote;
    }

    // console.log('Sending update to backend:', JSON.stringify(backendData, null, 2));

    const response = await fetch(`${API_URL}/notes/${id}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Update note error response:', response.status, errorText);
      throw new Error(`Falha ao atualizar nota (${response.status}): ${errorText}`);
    }

    const updatedNote: NoteBackend = await response.json();
    const mapped = mapToFrontend(updatedNote);
    setNotes(prev => prev.map(n => n.id === id ? mapped : n));
    return mapped;
  };

  const deleteNote = async (id: string) => {
    // Soft delete (move to trash)
    return updateNote(id, { isTrashed: true });
  };

  const permanentDeleteNote = async (id: string) => {
    if (!token) return;
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
  };

  const restoreFromTrash = async (id: string) => {
    return updateNote(id, { isTrashed: false });
  };

  const emptyTrash = async () => {
    if (!token) return;
    const response = await fetch(`${API_URL}/notes/empty_trash/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Falha ao esvaziar lixeira');
    }
    
    // Refresh notes locally
    setNotes(prev => prev.filter(n => !n.isTrashed));
  };

  const uploadAttachment = async (noteId: string, file: File, type: 'image' | 'audio' | 'file' | 'sketch' = 'file') => {
    if (!token) return;
    const formData = new FormData();
    formData.append('note', noteId);
    formData.append('file', file);
    formData.append('type', type);

    const response = await fetch(`${API_URL}/attachments/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Falha ao enviar anexo');
    }

    const newAttachment: AttachmentBackend = await response.json();
    const mapped = mapAttachmentToFrontend(newAttachment);
    
    setNotes(prev => prev.map(n => {
      if (n.id === noteId) {
        return {
          ...n,
          attachments: [...(n.attachments || []), mapped]
        };
      }
      return n;
    }));

    return mapped;
  };

  const deleteAttachment = async (attachmentId: string) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/attachments/${attachmentId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Falha ao excluir anexo');
      }

      setNotes(prev => prev.map(n => ({
        ...n,
        attachments: (n.attachments || []).filter(a => a.id !== attachmentId)
      })));
    } catch (error) {
      console.error('Delete attachment error:', error);
      throw error;
    }
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
    emptyTrash,
    uploadAttachment,
    deleteAttachment,
    refreshNotes: fetchNotes,
  };
}
