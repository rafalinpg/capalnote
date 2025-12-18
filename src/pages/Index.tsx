import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, PanelLeftClose, PanelLeft } from 'lucide-react';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { NoteList } from '@/components/notes/NoteList';
import { NoteEditor } from '@/components/notes/NoteEditor';
import { EmptyState } from '@/components/notes/EmptyState';
import { ShareModal } from '@/components/modals/ShareModal';
import { Button } from '@/components/ui/button';
import { mockNotes, mockNotebooks, mockTags } from '@/data/mockData';
import { Note, User } from '@/types';
import { cn } from '@/lib/utils';

type NavSection = 'notebooks' | 'tags' | 'pinned' | 'recent' | 'archived';

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
  const [notes, setNotes] = useState<Note[]>(mockNotes);
  const [searchQuery, setSearchQuery] = useState('');

  // Apply dark theme by default
  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (!stored) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  }, []);

  // Filter notes based on active section and search query
  const filteredNotes = useMemo(() => {
    let result: Note[];
    
    switch (activeSection) {
      case 'notebooks':
        result = selectedNotebookId
          ? notes.filter((n) => n.notebookId === selectedNotebookId && !n.isArchived)
          : notes.filter((n) => !n.isArchived);
        break;
      case 'tags':
        result = selectedTagId
          ? notes.filter((n) => n.tags.some((t) => t.id === selectedTagId) && !n.isArchived)
          : notes.filter((n) => !n.isArchived);
        break;
      case 'pinned':
        result = notes.filter((n) => n.isPinned && !n.isArchived);
        break;
      case 'recent':
        result = [...notes]
          .filter((n) => !n.isArchived)
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        break;
      case 'archived':
        result = notes.filter((n) => n.isArchived);
        break;
      default:
        result = notes.filter((n) => !n.isArchived);
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
        const notebook = mockNotebooks.find((n) => n.id === selectedNotebookId);
        return notebook?.name || 'Todos os Cadernos';
      case 'tags':
        const tag = mockTags.find((t) => t.id === selectedTagId);
        return tag?.name || 'Todas as Etiquetas';
      case 'pinned':
        return 'Notas Favoritas';
      case 'recent':
        return 'Notas Recentes';
      case 'archived':
        return 'Arquivadas';
      default:
        return 'Notas';
    }
  };

  const selectedNote = notes.find((n) => n.id === selectedNoteId);

  const handleUpdateNote = (updatedNote: Note) => {
    setNotes(notes.map((n) => (n.id === updatedNote.id ? updatedNote : n)));
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
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        user={user}
        onLogout={onLogout}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="text-muted-foreground"
                >
                  {sidebarCollapsed ? (
                    <PanelLeft className="w-5 h-5" />
                  ) : (
                    <PanelLeftClose className="w-5 h-5" />
                  )}
                </Button>
              </div>

              <Button className="gap-2 shadow-soft">
                <Plus className="w-4 h-4" />
                Nova Nota
              </Button>
            </div>

            {/* Note List */}
            <NoteList
              notes={filteredNotes}
              selectedNoteId={selectedNoteId}
              onNoteSelect={setSelectedNoteId}
              title={getSectionTitle()}
              subtitle={
                activeSection === 'notebooks' && selectedNotebookId
                  ? mockNotebooks.find((n) => n.id === selectedNotebookId)?.description
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
                onClose={() => setSelectedNoteId(undefined)}
                onUpdate={handleUpdateNote}
              />
            </motion.div>
          ) : (
            filteredNotes.length > 0 && (
              <div className="flex-1 min-w-0">
                <EmptyState onCreateNote={() => {}} />
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
    </div>
  );
}
