import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, PanelLeftClose, PanelLeft } from 'lucide-react';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { NoteList } from '@/components/notes/NoteList';
import { NoteEditor } from '@/components/notes/NoteEditor';
import { EmptyState } from '@/components/notes/EmptyState';
import { ShareModal } from '@/components/modals/ShareModal';
import { SearchCommand } from '@/components/search/SearchCommand';
import { Button } from '@/components/ui/button';
import { Note, User } from '@/types';
import { cn } from '@/lib/utils';
import { useNotebooks } from '@/hooks/useNotebooks';
import { useNotes } from '@/hooks/useNotes';
import { useTags } from '@/hooks/useTags';

type NavSection = 'notebooks' | 'tags' | 'pinned' | 'recent' | 'archived' | 'trash' | 'all_notes';

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
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { notebooks, createNotebook, updateNotebook, deleteNotebook } = useNotebooks();
  const { notes, createNote, updateNote, deleteNote, permanentDeleteNote, restoreFromTrash } = useNotes();
  const { tags, createTag, updateTag, deleteTag } = useTags();

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
      case 'notebooks':
        const notebook = notebooks?.find((n) => n.id === selectedNotebookId);
        return notebook?.name || 'Todos os Cadernos';
      case 'tags':
        const tag = tags.find((t) => t.id === selectedTagId);
        return tag?.name || 'Todas as Etiquetas';
      case 'pinned':
        return 'Notas Favoritas';
      case 'recent':
        return 'Notas Recentes';
      case 'archived':
        return 'Arquivadas';
      case 'trash':
        return 'Lixeira';
      case 'all_notes':
        return 'Todas as Notas';
      default:
        return 'Notas';
    }
  };

  const selectedNote = notes.find((n) => n.id === selectedNoteId);

  const handleUpdateNote = async (updatedNote: Note) => {
    try {
      await updateNote(updatedNote.id, updatedNote);
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (activeSection === 'trash') {
      if (window.confirm('Tem certeza que deseja excluir esta nota permanentemente? Esta ação não pode ser desfeita.')) {
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
    } else {
      if (window.confirm('Tem certeza que deseja mover esta nota para a lixeira?')) {
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
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        notebooks={notebooks}
        onCreateNotebook={createNotebook}
        onUpdateNotebook={updateNotebook}
        onDeleteNotebook={deleteNotebook}
        tags={tags}
        onCreateTag={createTag}
        onUpdateTag={updateTag}
        onDeleteTag={deleteTag}
      />

      {/* Main Content */}
      <div className="flex-1 flex min-w-0">
        {/* Note List Panel */}
        <div
          className={cn(
            'border-r border-border transition-all duration-300',
            selectedNote ? 'w-[360px]' : 'w-full max-w-2xl'
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
            <NoteList
              notes={filteredNotes}
              selectedNoteId={selectedNoteId}
              onNoteSelect={setSelectedNoteId}
              onDelete={handleDeleteNote}
              onRestore={handleRestoreNote}
              title={getSectionTitle()}
              isTrash={activeSection === 'trash'}
              subtitle={
                activeSection === 'notebooks' && selectedNotebookId
                  ? notebooks?.find((n) => n.id === selectedNotebookId)?.description
                  : undefined
              }
            />
          </div>
        </div>

        {/* Note Editor Panel */}
        <AnimatePresence mode="wait">
          {selectedNote ? (
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
              />
            </motion.div>
          ) : (
            filteredNotes.length > 0 && (
              <div className="flex-1 min-w-0">
                <EmptyState onCreateNote={handleCreateNote} />
              </div>
            )
          )}
        </AnimatePresence>
      </div>

      {/* Share Modal */}
      <ShareModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        itemType="note"
        itemName={selectedNote?.title || ''}
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
