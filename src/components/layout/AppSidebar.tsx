import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Tags,
  Pin,
  Clock,
  Settings,
  Search,
  Plus,
  ChevronRight,
  Archive,
  LogOut,
  Moon,
  Sun,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { mockNotebooks, mockTags } from '@/data/mockData';
import { useTheme } from '@/hooks/useTheme';
import { User } from '@/types';
type NavSection = 'notebooks' | 'tags' | 'pinned' | 'recent' | 'archived';

interface AppSidebarProps {
  activeSection: NavSection;
  onSectionChange: (section: NavSection) => void;
  selectedNotebookId?: string;
  onNotebookSelect: (id: string) => void;
  selectedTagId?: string;
  onTagSelect: (id: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  user: User | null;
  onLogout: () => void;
}

export function AppSidebar({
  activeSection,
  onSectionChange,
  selectedNotebookId,
  onNotebookSelect,
  selectedTagId,
  onTagSelect,
  isCollapsed,
  onToggleCollapse,
  user,
  onLogout,
}: AppSidebarProps) {
  const [notebooksExpanded, setNotebooksExpanded] = useState(true);
  const [tagsExpanded, setTagsExpanded] = useState(true);
  const { theme, toggleTheme } = useTheme();

  const activeNotebooks = mockNotebooks.filter((n) => !n.isArchived);
  const archivedNotebooks = mockNotebooks.filter((n) => n.isArchived);

  const navItems = [
    { id: 'pinned' as NavSection, icon: Pin, label: 'Favoritas' },
    { id: 'recent' as NavSection, icon: Clock, label: 'Recentes' },
    { id: 'archived' as NavSection, icon: Archive, label: 'Arquivadas' },
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 72 : 280 }}
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
          <BookOpen className="w-5 h-5 text-primary-foreground" />
        </div>
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex-1 overflow-hidden"
            >
              <h1 className="font-semibold text-foreground truncate">CapalNote</h1>
              <p className="text-xs text-muted-foreground truncate">Notas Corporativas</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Search */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-4"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar notas..."
                className="pl-9 bg-surface-sunken border-transparent focus:border-primary/50"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isCollapsed && (
        <div className="px-4 pb-4 flex justify-center">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Search className="w-5 h-5" />
          </Button>
        </div>
      )}

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
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="truncate"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          ))}
        </div>

        <Separator className="my-2 bg-sidebar-border" />

        {/* Notebooks */}
        <div className="px-2">
          <button
            onClick={() => !isCollapsed && setNotebooksExpanded(!notebooksExpanded)}
            className={cn(
              'w-full flex items-center gap-2 px-3 h-9 text-xs font-medium',
              'text-muted-foreground hover:text-foreground transition-colors',
              isCollapsed && 'justify-center'
            )}
          >
            {!isCollapsed && (
              <>
                <ChevronRight
                  className={cn(
                    'w-4 h-4 transition-transform duration-200',
                    notebooksExpanded && 'rotate-90'
                  )}
                />
                <span className="flex-1 text-left">CADERNOS</span>
                <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100" />
              </>
            )}
            {isCollapsed && <BookOpen className="w-5 h-5" />}
          </button>

          <AnimatePresence>
            {(notebooksExpanded || isCollapsed) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {activeNotebooks.map((notebook) => (
                  <Button
                    key={notebook.id}
                    variant="ghost"
                    onClick={() => {
                      onSectionChange('notebooks');
                      onNotebookSelect(notebook.id);
                    }}
                    className={cn(
                      'w-full justify-start gap-3 h-9 px-3',
                      !isCollapsed && 'pl-7',
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
                    {!isCollapsed && (
                      <span className="truncate flex-1 text-left">{notebook.name}</span>
                    )}
                    {!isCollapsed && (
                      <span className="text-xs text-muted-foreground">{notebook.noteCount}</span>
                    )}
                  </Button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Separator className="my-2 bg-sidebar-border" />

        {/* Tags */}
        <div className="px-2">
          <button
            onClick={() => !isCollapsed && setTagsExpanded(!tagsExpanded)}
            className={cn(
              'w-full flex items-center gap-2 px-3 h-9 text-xs font-medium',
              'text-muted-foreground hover:text-foreground transition-colors',
              isCollapsed && 'justify-center'
            )}
          >
            {!isCollapsed && (
              <>
                <ChevronRight
                  className={cn(
                    'w-4 h-4 transition-transform duration-200',
                    tagsExpanded && 'rotate-90'
                  )}
                />
                <span className="flex-1 text-left">ETIQUETAS</span>
              </>
            )}
            {isCollapsed && <Tags className="w-5 h-5" />}
          </button>

          <AnimatePresence>
            {(tagsExpanded || isCollapsed) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {mockTags.map((tag) => (
                  <Button
                    key={tag.id}
                    variant="ghost"
                    onClick={() => {
                      onSectionChange('tags');
                      onTagSelect(tag.id);
                    }}
                    className={cn(
                      'w-full justify-start gap-3 h-9 px-3',
                      !isCollapsed && 'pl-7',
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
                    {!isCollapsed && <span className="truncate">{tag.name}</span>}
                  </Button>
                ))}
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
          {!isCollapsed && <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>}
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-10 px-3 text-sidebar-foreground hover:text-foreground"
        >
          <Settings className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span>Configurações</span>}
        </Button>

        <Separator className="bg-sidebar-border" />

        <div className={cn('flex items-center gap-3 px-3 py-2', isCollapsed && 'justify-center')}>
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              {user?.name
                ?.split(' ')
                .map((n) => n[0])
                .join('') || 'U'}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && user && (
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          )}
          {!isCollapsed && (
            <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground" onClick={onLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
