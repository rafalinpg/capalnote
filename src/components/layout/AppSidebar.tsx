import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Notebook as NotebookIcon,
  Tag as TagIcon,
  Pin,
  Clock,
  Trash2,
  Plus,
  Search,
  Settings,
  MoreVertical,
  ChevronDown,
  ChevronRight,
  LogOut,
  Moon,
  Sun,
  FileText,
  StickyNote,
} from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from '@/components/ui/context-menu';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { mockTags } from '@/data/mockData';
import { useTheme } from '@/hooks/useTheme';
import { User, Notebook, Tag } from '@/types';
type NavSection = 'notebooks' | 'tags' | 'pinned' | 'recent' | 'archived' | 'trash' | 'all_notes' | 'files';

interface AppSidebarProps {
  activeSection: NavSection;
  onSectionChange: (section: NavSection) => void;
  selectedNotebookId?: string;
  onNotebookSelect: (id: string) => void;
  selectedTagId?: string;
  onTagSelect: (id: string) => void;
  user: User | null;
  onLogout: () => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  notebooks: Notebook[];
  onCreateNotebook: (name: string) => Promise<Notebook>;
  onUpdateNotebook: (id: string, data: Partial<Notebook>) => Promise<Notebook>;
  onDeleteNotebook: (id: string) => Promise<void>;
  tags: Tag[];
  onCreateTag: (name: string) => Promise<Tag>;
  onUpdateTag: (id: string, data: Partial<Tag>) => Promise<Tag>;
  onDeleteTag: (id: string) => Promise<void>;
}

export function AppSidebar({
  activeSection,
  onSectionChange,
  selectedNotebookId,
  onNotebookSelect,
  selectedTagId,
  onTagSelect,
  user,
  onLogout,
  onOpenSearch,
  onOpenSettings,
  searchQuery,
  onSearchChange,
  notebooks,
  onCreateNotebook,
  onUpdateNotebook,
  onDeleteNotebook,
  tags,
  onCreateTag,
  onUpdateTag,
  onDeleteTag,
}: AppSidebarProps) {
  const [notebooksExpanded, setNotebooksExpanded] = useState(true);
  const [tagsExpanded, setTagsExpanded] = useState(true);
  const [moreExpanded, setMoreExpanded] = useState(true);
  const [isCreatingNotebook, setIsCreatingNotebook] = useState(false);
  const [newNotebookName, setNewNotebookName] = useState('');
  const [editingNotebookId, setEditingNotebookId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editTagName, setEditTagName] = useState('');
  const { theme, toggleTheme } = useTheme();

  const activeNotebooks = notebooks?.filter((n) => !n.isArchived) || [];

  const navItems = [
    { id: 'pinned' as NavSection, icon: Pin, label: 'Favoritas' },
    { id: 'recent' as NavSection, icon: StickyNote, label: 'Notas' },
    { id: 'files' as NavSection, icon: FileText, label: 'Arquivos' },
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: 280 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'h-screen flex flex-col bg-sidebar border-r border-sidebar-border',
        'relative overflow-hidden'
      )}
    >
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <div
          className={cn(
            'w-9 h-9 rounded-lg bg-primary flex items-center justify-center',
            'shadow-soft'
          )}
        >
          <NotebookIcon className="w-5 h-5 text-primary-foreground" />
        </div>
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex-1 overflow-hidden"
          >
            <h1 className="font-semibold text-foreground truncate">CapalNote</h1>
            <p className="text-xs text-muted-foreground truncate">Notas Corporativas</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Search */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="px-4 pb-4"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <button
              onClick={onOpenSearch}
              className={cn(
                "flex h-10 w-full rounded-md border border-transparent bg-surface-sunken px-3 py-2 pl-9 pr-9 text-sm ring-offset-background",
                "text-muted-foreground text-left",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "hover:text-foreground transition-colors"
              )}
            >
              Buscar notas...
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      <Separator className="bg-sidebar-border" />

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* Quick Actions */}
        <div className="px-2 space-y-1">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              onClick={() => onSectionChange(item.id)}
              className={cn(
                'w-full justify-start gap-3 h-10 px-3',
                'text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent',
                'transition-colors duration-150',
                activeSection === item.id && 'bg-sidebar-accent text-sidebar-accent-foreground'
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <AnimatePresence>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="truncate"
                >
                  {item.label}
                </motion.span>
              </AnimatePresence>
            </Button>
          ))}
        </div>

        <Separator className="my-2 bg-sidebar-border" />

        {/* Notebooks */}
        <div className="px-2">
          <button
            onClick={() => setNotebooksExpanded(!notebooksExpanded)}
            className={cn(
              'w-full flex items-center gap-2 px-3 h-9 text-xs font-medium',
              'text-muted-foreground hover:text-foreground transition-colors'
            )}
          >
            <>
              <ChevronRight
                className={cn(
                  'w-4 h-4 transition-transform duration-200',
                  notebooksExpanded && 'rotate-90'
                )}
              />
              <span className="flex-1 text-left">CADERNOS</span>
              <div
                className="p-1 hover:bg-sidebar-accent rounded-md cursor-pointer transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCreatingNotebook(true);
                  setNotebooksExpanded(true);
                }}
                title="Criar novo caderno"
              >
                <Plus className="w-4 h-4 text-muted-foreground hover:text-primary" />
              </div>
            </>
          </button>

          <AnimatePresence>
            {notebooksExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {isCreatingNotebook && (
                  <div className="px-3 py-1">
                    <Input
                      autoFocus
                      value={newNotebookName}
                      onChange={(e) => setNewNotebookName(e.target.value)}
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter' && newNotebookName.trim()) {
                          await onCreateNotebook(newNotebookName);
                          setNewNotebookName('');
                          setIsCreatingNotebook(false);
                        } else if (e.key === 'Escape') {
                          setIsCreatingNotebook(false);
                          setNewNotebookName('');
                        }
                      }}
                      onBlur={() => {
                        if (!newNotebookName.trim()) {
                          setIsCreatingNotebook(false);
                        }
                      }}
                      placeholder="Nome do caderno..."
                      className="h-8 text-xs"
                    />
                  </div>
                )}
                {activeNotebooks.map((notebook) => (
                  <ContextMenu key={notebook.id}>
                    <ContextMenuTrigger>
                      {editingNotebookId === notebook.id ? (
                        <div className="px-3 py-1">
                          <Input
                            autoFocus
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={async (e) => {
                              if (e.key === 'Enter' && editName.trim()) {
                                await onUpdateNotebook(notebook.id, { name: editName });
                                setEditingNotebookId(null);
                              } else if (e.key === 'Escape') {
                                setEditingNotebookId(null);
                              }
                            }}
                            onBlur={() => setEditingNotebookId(null)}
                            className="h-8 text-xs"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          onClick={() => {
                            onSectionChange('notebooks');
                            onNotebookSelect(notebook.id);
                          }}
                          className={cn(
                            'w-full justify-start gap-3 h-9 px-3 pl-7',
                            'text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent',
                            selectedNotebookId === notebook.id &&
                              activeSection === 'notebooks' &&
                              'bg-sidebar-accent text-sidebar-accent-foreground'
                          )}
                        >
                          <div
                            className="w-2 h-2 rounded-full bg-primary shrink-0"
                            style={{ opacity: 0.6 + Math.random() * 0.4 }}
                          />
                          <span className="truncate flex-1 text-left">{notebook.name}</span>
                          <span className="text-xs text-muted-foreground">{notebook.noteCount}</span>
                        </Button>
                      )}
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem
                        onClick={() => {
                          setEditName(notebook.name);
                          setEditingNotebookId(notebook.id);
                        }}
                      >
                        Renomear
                      </ContextMenuItem>
                      <ContextMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => {
                          onDeleteNotebook(notebook.id);
                        }}
                      >
                        Excluir
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Separator className="my-2 bg-sidebar-border" />

        {/* Tags */}
        <div className="px-2">
          <button
            onClick={() => setTagsExpanded(!tagsExpanded)}
            className={cn(
              'w-full flex items-center gap-2 px-3 h-9 text-xs font-medium',
              'text-muted-foreground hover:text-foreground transition-colors'
            )}
          >
            <>
              <ChevronRight
                className={cn(
                  'w-4 h-4 transition-transform duration-200',
                  tagsExpanded && 'rotate-90'
                )}
              />
              <span className="flex-1 text-left">ETIQUETAS</span>
              <div
                className="p-1 hover:bg-sidebar-accent rounded-md cursor-pointer transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCreatingTag(true);
                  setTagsExpanded(true);
                }}
                title="Criar nova etiqueta"
              >
                <Plus className="w-4 h-4 text-muted-foreground hover:text-primary" />
              </div>
            </>
          </button>

          <AnimatePresence>
            {tagsExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {isCreatingTag && (
                  <div className="px-3 py-1">
                    <Input
                      autoFocus
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter' && newTagName.trim()) {
                          await onCreateTag(newTagName);
                          setNewTagName('');
                          setIsCreatingTag(false);
                        } else if (e.key === 'Escape') {
                          setIsCreatingTag(false);
                          setNewTagName('');
                        }
                      }}
                      onBlur={() => {
                        if (!newTagName.trim()) {
                          setIsCreatingTag(false);
                        }
                      }}
                      placeholder="Nome da etiqueta..."
                      className="h-8 text-xs"
                    />
                  </div>
                )}
                {tags.map((tag) => (
                  <ContextMenu key={tag.id}>
                    <ContextMenuTrigger>
                      {editingTagId === tag.id ? (
                        <div className="px-3 py-1">
                          <Input
                            autoFocus
                            value={editTagName}
                            onChange={(e) => setEditTagName(e.target.value)}
                            onKeyDown={async (e) => {
                              if (e.key === 'Enter' && editTagName.trim()) {
                                await onUpdateTag(tag.id, { name: editTagName });
                                setEditingTagId(null);
                              } else if (e.key === 'Escape') {
                                setEditingTagId(null);
                              }
                            }}
                            onBlur={() => setEditingTagId(null)}
                            className="h-8 text-xs"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          onClick={() => {
                            onSectionChange('tags');
                            onTagSelect(tag.id);
                          }}
                          className={cn(
                            'w-full justify-start gap-3 h-9 px-3 pl-7',
                            'text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent',
                            selectedTagId === tag.id &&
                              activeSection === 'tags' &&
                              'bg-sidebar-accent text-sidebar-accent-foreground'
                          )}
                        >
                          <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: tag.color }}
                          />
                          <span className="truncate">{tag.name}</span>
                        </Button>
                      )}
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem
                        onClick={() => {
                          setEditTagName(tag.name);
                          setEditingTagId(tag.id);
                        }}
                      >
                        Renomear
                      </ContextMenuItem>
                      <ContextMenuSub>
                        <ContextMenuSubTrigger>Mudar cor</ContextMenuSubTrigger>
                        <ContextMenuSubContent className="w-48 p-2">
                          <div className="grid grid-cols-5 gap-1">
                            {[
                              '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
                              '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#d946ef',
                              '#ec4899', '#f43f5e', '#71717a', '#3f3f46', '#000000'
                            ].map((color) => (
                              <button
                                key={color}
                                className="w-6 h-6 rounded-full border border-border hover:scale-110 transition-transform"
                                style={{ backgroundColor: color }}
                                onClick={() => onUpdateTag(tag.id, { color })}
                                title={color}
                              />
                            ))}
                          </div>
                        </ContextMenuSubContent>
                      </ContextMenuSub>
                      <ContextMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => {
                          onDeleteTag(tag.id);
                        }}
                      >
                        Excluir
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Separator className="my-2 bg-sidebar-border" />

        {/* Mais */}
        <div className="px-2">
          <button
            onClick={() => setMoreExpanded(!moreExpanded)}
            className={cn(
              'w-full flex items-center gap-2 px-3 h-9 text-xs font-medium',
              'text-muted-foreground hover:text-foreground transition-colors'
            )}
          >
            <>
              <ChevronRight
                className={cn(
                  'w-4 h-4 transition-transform duration-200',
                  moreExpanded && 'rotate-90'
                )}
              />
              <span className="flex-1 text-left">MAIS</span>
            </>
          </button>

          <AnimatePresence>
            {moreExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <Button
                  variant="ghost"
                  onClick={() => onSectionChange('trash')}
                  className={cn(
                    'w-full justify-start gap-3 h-9 px-3 pl-7',
                    'text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent',
                    activeSection === 'trash' && 'bg-sidebar-accent text-sidebar-accent-foreground'
                  )}
                >
                  <Trash2 className="w-4 h-4 shrink-0" />
                  <span className="truncate">Lixeira</span>
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-2 space-y-1">
        <Button
          variant="ghost"
          onClick={toggleTheme}
          className="w-full justify-start gap-3 h-10 px-3 text-sidebar-foreground hover:text-foreground"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 shrink-0" />
          ) : (
            <Moon className="w-5 h-5 shrink-0" />
          )}
          <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
        </Button>

        <Button
          variant="ghost"
          onClick={onOpenSettings}
          className="w-full justify-start gap-3 h-10 px-3 text-sidebar-foreground hover:text-foreground"
        >
          <Settings className="w-5 h-5 shrink-0" />
          <span>Configurações</span>
        </Button>

        <Separator className="bg-sidebar-border" />

        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              {user?.name
                ?.split(' ')
                .map((n) => n[0])
                .join('') || 'U'}
            </AvatarFallback>
          </Avatar>
          {user && (
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          )}
          <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground" onClick={onLogout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.aside>
  );
}
