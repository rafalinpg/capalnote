import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, PanelLeftClose, PanelLeft } from 'lucide-react';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { NoteList } from '@/components/notes/NoteList';
import { NoteEditor } from '@/components/notes/NoteEditor';
import { EmptyState } from '@/components/notes/EmptyState';
import { FileList } from '@/components/files/FileList';
import { FilePreview } from '@/components/files/FilePreview';
import { ShareModal } from '@/components/modals/ShareModal';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { ConfirmationModal } from '@/components/modals/ConfirmationModal';
import { SearchCommand } from '@/components/search/SearchCommand';
import { Button } from '@/components/ui/button';
import { Note, User } from '@/types';
import { cn } from '@/lib/utils';
import { useNotebooks } from '@/hooks/useNotebooks';
import { useNotes } from '@/hooks/useNotes';
import { useTags } from '@/hooks/useTags';
import { useToast } from '@/hooks/use-toast';
import { API_URL } from '@/lib/api';

type NavSection = 'notebooks' | 'tags' | 'pinned' | 'recent' | 'archived' | 'trash' | 'all_notes' | 'files';

interface IndexProps {
  user: User;
  onLogout: () => void;
}

export default function Index({ user, onLogout }: IndexProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState<NavSection>('recent');
  const [selectedNotebookId, setSelectedNotebookId] = useState<string>();
  const [selectedTagId, setSelectedTagId] = useState<string>();
  const [selectedNoteId, setSelectedNoteId] = useState<string>();
  const [selectedFileId, setSelectedFileId] = useState<string>();
  const [shareTarget, setShareTarget] = useState<{ type: 'note' | 'notebook', id: string, name: string } | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    cancelText: string;
    variant: 'default' | 'destructive';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    variant: 'default',
    onConfirm: () => {},
  });

  const closeConfirmationModal = () => {
    setConfirmationModal(prev => ({ ...prev, isOpen: false }));
  };
  
  const searchParams = useSearchParams()[0];
  const setSearchParams = useSearchParams()[1];
  const { toast } = useToast();
  const inviteToken = searchParams.get('token');
  
  const { notebooks, createNotebook, updateNotebook, deleteNotebook, refresh: refreshNotebooks } = useNotebooks();
  const { notes, createNote, updateNote, deleteNote, permanentDeleteNote, restoreFromTrash, emptyTrash, uploadAttachment, deleteAttachment, refreshNotes } = useNotes();
  const { tags, createTag, updateTag, deleteTag } = useTags();

  useEffect(() => {
    const acceptInvite = async (token: string) => {
        try {
            const authToken = localStorage.getItem('access_token');
            const response = await fetch(`${API_URL}/share/accept/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token }),
            });
            
            if (response.ok) {
                toast({
                    title: "Convite aceito",
                    description: "Você agora tem acesso ao item compartilhado.",
                });
                setSearchParams({}, { replace: true });
                refreshNotebooks();
                refreshNotes();
            } else {
                 toast({
                    title: "Erro",
                    description: "Não foi possível aceitar o convite ou ele já expirou.",
                    variant: "destructive",
                });
            }
        } catch (error) {
             toast({
                title: "Erro",
                description: "Erro ao processar convite.",
                variant: "destructive",
            });
        }
    };

    if (inviteToken) {
        acceptInvite(inviteToken);
    }
  }, [inviteToken, toast, setSearchParams]);

  // Apply dark theme by default
  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (!stored) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsSearchOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Filter notes based on active section and search query
  const filteredNotes = useMemo(() => {
    let result: Note[];
    
    switch (activeSection) {
      case 'notebooks':
        result = selectedNotebookId
          ? notes.filter((n) => n.notebookId === selectedNotebookId && !n.isArchived && !n.isTrashed)
          : notes.filter((n) => !n.isArchived && !n.isTrashed);
        break;
      case 'tags':
        result = selectedTagId
          ? notes.filter((n) => n.tags.some((t) => t.id === selectedTagId) && !n.isArchived && !n.isTrashed)
          : notes.filter((n) => !n.isArchived && !n.isTrashed);
        break;
      case 'pinned':
        result = notes.filter((n) => n.isPinned && !n.isArchived && !n.isTrashed);
        break;
      case 'recent':
        result = [...notes]
          .filter((n) => !n.isArchived && !n.isTrashed)
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        break;
      case 'archived':
        result = notes.filter((n) => n.isArchived && !n.isTrashed);
        break;
      case 'trash':
        result = notes.filter((n) => n.isTrashed);
        break;
      default:
        result = notes.filter((n) => !n.isArchived && !n.isTrashed);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((note) => 
        note.title.toLowerCase().includes(query) ||
        note.contentText.toLowerCase().includes(query) ||
        note.tags.some((tag) => tag.name.toLowerCase().includes(query))
      );
    }

    return result;
  }, [activeSection, selectedNotebookId, selectedTagId, notes, searchQuery]);

  // Get section title
  const getSectionTitle = () => {
    switch (activeSection) {
      case 'notebooks': {
        const notebook = notebooks?.find((n) => n.id === selectedNotebookId);
        return notebook?.name || 'Todos os Cadernos';
      }
      case 'tags': {
        const tag = tags.find((t) => t.id === selectedTagId);
        return tag?.name || 'Todas as Etiquetas';
      }
      case 'pinned':
        return 'Notas Favoritas';
      case 'recent':
        return 'Todas as Notas';
      case 'archived':
        return 'Arquivadas';
      case 'trash':
        return 'Lixeira';
      case 'all_notes':
        return 'Todas as Notas';
      case 'files':
        return 'Arquivos';
      default:
        return 'Notas';
    }
  };

  const selectedNote = notes.find((n) => n.id === selectedNoteId);

  const selectedFile = useMemo(() => {
    if (!selectedFileId) return undefined;
    for (const note of notes) {
      const attachment = note.attachments?.find(a => a.id === selectedFileId);
      if (attachment) {
        return {
          ...attachment,
          noteTitle: note.title,
          noteId: note.id
        };
      }
    }
    return undefined;
  }, [selectedFileId, notes]);

  const handleOpenNote = (noteId: string) => {
     setSelectedNoteId(noteId);
     // Find the note to determine its context
     const note = notes.find(n => n.id === noteId);
     if (note) {
        if (note.isTrashed) {
          setActiveSection('trash');
        } else if (note.isArchived) {
          setActiveSection('archived');
        } else {
          setActiveSection('recent');
        }
     }
   };

  const handleUpdateNote = async (updatedNote: Partial<Note> & { id: string }) => {
    // Check if note is trashed
    const currentNote = notes.find(n => n.id === updatedNote.id);
    // If we are only updating isTrashed (restoring/deleting), allow it.
    // We check if 'isTrashed' is in updatedNote and distinct from current.
    // But typically updateNote updates fields.
    
    // If the note is currently trashed, and we are NOT restoring it (setting isTrashed to false), block update.
    if (currentNote?.isTrashed && updatedNote.isTrashed !== false) {
       toast({
         title: "Não permitido",
         description: "Notas na lixeira não podem ser editadas.",
         variant: "destructive",
       });
       return;
    }

    try {
      await updateNote(updatedNote.id, updatedNote);
    } catch (error) {
      console.error('Failed to update note:', error);
      throw error;
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (activeSection === 'trash') {
      if (!user.isSuperuser) {
        alert('Apenas superusuários podem excluir notas permanentemente.');
        return;
      }

      setConfirmationModal({
        isOpen: true,
        title: 'Excluir permanentemente?',
        description: 'Cuidado: A nota desaparecerá para sempre. Esta ação não pode ser desfeita.',
        confirmText: 'Excluir',
        cancelText: 'Cancelar',
        variant: 'destructive',
        onConfirm: async () => {
          try {
            await permanentDeleteNote(noteId);
            if (selectedNoteId === noteId) {
              setSelectedNoteId(undefined);
            }
          } catch (error) {
            console.error('Failed to delete note permanently:', error);
            alert('Erro ao excluir nota permanentemente');
          }
        }
      });
    } else {
      setConfirmationModal({
        isOpen: true,
        title: 'Mover para lixeira?',
        description: 'Tem certeza que deseja mover esta nota para a lixeira?',
        confirmText: 'Mover para lixeira',
        cancelText: 'Cancelar',
        variant: 'destructive',
        onConfirm: async () => {
          try {
            await deleteNote(noteId);
            if (selectedNoteId === noteId) {
              setSelectedNoteId(undefined);
            }
          } catch (error) {
            console.error('Failed to delete note:', error);
            alert('Erro ao excluir nota');
          }
        }
      });
    }
  };

  const handleRestoreNote = async (noteId: string) => {
    try {
      await restoreFromTrash(noteId);
      if (selectedNoteId === noteId) {
        setSelectedNoteId(undefined);
      }
    } catch (error) {
      console.error('Failed to restore note:', error);
      alert('Erro ao restaurar nota');
    }
  };

  const handleEmptyTrash = async () => {
    if (!user?.isSuperuser) return;
    
    setConfirmationModal({
      isOpen: true,
      title: 'Esvaziar lixeira?',
      description: 'Tem certeza que deseja esvaziar a lixeira? Todas as notas na lixeira serão excluídas permanentemente.',
      confirmText: 'Esvaziar Lixeira',
      cancelText: 'Cancelar',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          await emptyTrash();
          setSelectedNoteId(undefined);
          toast({
            title: "Lixeira esvaziada",
            description: "Todas as notas foram removidas permanentemente.",
          });
        } catch (error) {
          console.error('Failed to empty trash:', error);
          toast({
            title: "Erro",
            description: "Não foi possível esvaziar a lixeira.",
            variant: "destructive"
          });
        }
      }
    });
  };

  const handleCreateNote = async () => {
    const notebookId = selectedNotebookId || (notebooks.length > 0 ? notebooks[0].id : undefined);

    if (!notebookId) {
      alert('Crie um caderno antes de criar uma nota.');
      return;
    }

    try {
      const newNote = await createNote(notebookId);
      setSelectedNoteId(newNote.id);
    } catch (error) {
      console.error('Failed to create note:', error);
      alert('Erro ao criar nota. Verifique o console para mais detalhes.');
    }
  };

  const handleDeleteNotebook = async (id: string) => {
    setConfirmationModal({
      isOpen: true,
      title: 'Excluir caderno?',
      description: 'Tem certeza que deseja excluir este caderno? Esta ação não pode ser desfeita.',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          await deleteNotebook(id);
          if (selectedNotebookId === id) {
            setSelectedNotebookId(undefined);
            setActiveSection('recent');
          }
        } catch (error) {
           console.error("Failed to delete notebook", error);
           toast({ title: "Erro", description: "Erro ao excluir caderno", variant: "destructive" });
        }
      }
    });
  };

  const handleDeleteTag = async (id: string) => {
    setConfirmationModal({
      isOpen: true,
      title: 'Excluir etiqueta?',
      description: 'Tem certeza que deseja excluir esta etiqueta?',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          await deleteTag(id);
          if (selectedTagId === id) {
            setSelectedTagId(undefined);
            setActiveSection('recent');
          }
        } catch (error) {
           console.error("Failed to delete tag", error);
           toast({ title: "Erro", description: "Erro ao excluir etiqueta", variant: "destructive" });
        }
      }
    });
  };

  const handleSearchSelect = (note: Note) => {
    setActiveSection('notebooks');
    setSelectedNotebookId(note.notebookId);
    setSelectedNoteId(note.id);
    setIsSearchOpen(false);
  };

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Sidebar */}
      <AppSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        selectedNotebookId={selectedNotebookId}
        onNotebookSelect={setSelectedNotebookId}
        selectedTagId={selectedTagId}
        onTagSelect={setSelectedTagId}
        user={user}
        onLogout={onLogout}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        notebooks={notebooks}
        onCreateNotebook={createNotebook}
        onUpdateNotebook={updateNotebook}
        onDeleteNotebook={handleDeleteNotebook}
        tags={tags}
        onCreateTag={createTag}
        onUpdateTag={updateTag}
        onDeleteTag={handleDeleteTag}
      />

      {/* Main Content */}
      <div className="flex-1 flex min-w-0">
        {/* Note List Panel */}
        <div
          className={cn(
            'border-r border-border transition-all duration-300',
            (selectedNote || activeSection === 'files') ? 'w-[360px]' : 'w-full max-w-2xl'
          )}
        >
          <div className="h-full flex flex-col">
            {/* Top Bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/50 backdrop-blur">
              <div className="flex items-center gap-2">
              </div>

              <Button className="gap-2 shadow-soft" onClick={handleCreateNote}>
                <Plus className="w-4 h-4" />
                Nova Nota
              </Button>
            </div>

            {/* Note List */}
            {activeSection === 'files' ? (
              <FileList
                notes={notes}
                selectedFileId={selectedFileId}
                onFileSelect={setSelectedFileId}
              />
            ) : (
              <NoteList
                notes={filteredNotes}
                selectedNoteId={selectedNoteId}
                onNoteSelect={setSelectedNoteId}
                onDelete={handleDeleteNote}
                onRestore={handleRestoreNote}
                title={getSectionTitle()}
                isTrash={activeSection === 'trash'}
                onEmptyTrash={activeSection === 'trash' && user?.isSuperuser ? handleEmptyTrash : undefined}
                subtitle={
                  activeSection === 'notebooks' && selectedNotebookId
                    ? notebooks?.find((n) => n.id === selectedNotebookId)?.description
                    : undefined
                }
                creatorName={
                  activeSection === 'notebooks' && selectedNotebookId
                    ? notebooks?.find((n) => n.id === selectedNotebookId)?.ownerId
                    : undefined
                }
                onShare={activeSection === 'notebooks' && selectedNotebookId ? () => {
                   const notebook = notebooks.find(n => n.id === selectedNotebookId);
                   if (notebook) {
                      setShareTarget({ type: 'notebook', id: notebook.id, name: notebook.name });
                   }
                } : undefined}
                userRole={activeSection === 'notebooks' && selectedNotebookId ? notebooks.find(n => n.id === selectedNotebookId)?.userRole : undefined}
              />
            )}
          </div>
        </div>

        {/* Note Editor Panel */}
        <AnimatePresence mode="wait">
          {activeSection === 'files' ? (
             selectedFile ? (
               <motion.div
                 key={selectedFile.id}
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 className="flex-1 min-w-0"
               >
                 <FilePreview 
                   attachment={selectedFile}
                   onOpenNote={handleOpenNote}
                 />
               </motion.div>
             ) : (
               <div className="flex-1 min-w-0 flex items-center justify-center text-muted-foreground">
                 Selecione um arquivo para visualizar
               </div>
             )
          ) : selectedNote ? (
            <motion.div
              key={selectedNote.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 min-w-0"
            >
              <NoteEditor
                note={selectedNote}
                notebooks={notebooks}
                tags={tags}
                onClose={() => setSelectedNoteId(undefined)}
                onUpdate={handleUpdateNote}
                onDelete={handleDeleteNote}
                onUploadAttachment={(file, type) => uploadAttachment(selectedNote.id, file, type)}
                onDeleteAttachment={deleteAttachment}
                onShare={() => setShareTarget({ type: 'note', id: selectedNote.id, name: selectedNote.title })}
              />
            </motion.div>
          ) : (
            <div className="flex-1 min-w-0">
              <EmptyState onCreateNote={handleCreateNote} />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        open={isSettingsModalOpen}
        onOpenChange={setIsSettingsModalOpen}
        user={user}
        onUpdateUser={() => window.location.reload()}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={closeConfirmationModal}
        onConfirm={confirmationModal.onConfirm}
        title={confirmationModal.title}
        description={confirmationModal.description}
        confirmText={confirmationModal.confirmText}
        cancelText={confirmationModal.cancelText}
        variant={confirmationModal.variant}
      />

      {/* Share Modal */}
      <ShareModal
        open={!!shareTarget}
        onOpenChange={(open) => !open && setShareTarget(null)}
        itemType={shareTarget?.type || 'note'}
        itemId={shareTarget?.id || ''}
        itemName={shareTarget?.name || ''}
      />

      {/* Search Command */}
      <SearchCommand
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        notes={notes.filter(n => !n.isArchived && !n.isTrashed)}
        notebooks={notebooks}
        onSelectNote={handleSearchSelect}
      />
    </div>
  );
}
