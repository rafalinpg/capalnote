import { motion } from 'framer-motion';
import { Pin, MoreHorizontal, Calendar, Tag as TagIcon, Trash2, RotateCcw, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Note, AccessRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NoteListProps {
  notes: Note[];
  selectedNoteId?: string;
  onNoteSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRestore?: (id: string) => void;
  title: string;
  subtitle?: string;
  isTrash?: boolean;
  onShare?: () => void;
  onEmptyTrash?: () => void;
  userRole?: AccessRole;
  creatorName?: string;
}

export function NoteList({ notes, selectedNoteId, onNoteSelect, onDelete, onRestore, title, subtitle, isTrash, onShare, onEmptyTrash, userRole, creatorName }: NoteListProps) {
  const pinnedNotes = notes.filter((n) => n.isPinned);
  const regularNotes = notes.filter((n) => !n.isPinned);
  
  const canShare = userRole === 'owner' || userRole === 'full_access';

  const renderNoteCard = (note: Note, index: number) => (
    <motion.div
      key={note.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
      onClick={() => onNoteSelect(note.id)}
      className={cn(
        'group p-4 rounded-xl cursor-pointer',
        'border border-transparent',
        'transition-all duration-200',
        'hover:bg-card hover:border-border hover:shadow-soft',
        selectedNoteId === note.id && 'bg-card border-primary/30 shadow-soft'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {note.isPinned && (
              <Pin className="w-3.5 h-3.5 text-primary fill-primary shrink-0" />
            )}
            <h3 className="font-medium text-foreground truncate">{note.title}</h3>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {note.contentText.slice(0, 120)}...
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              {formatDistanceToNow(note.updatedAt, { addSuffix: true, locale: ptBR })}
            </span>
            {note.tags.length > 0 && (
              <div className="flex items-center gap-1.5">
                {note.tags.slice(0, 2).map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="h-5 text-xs px-2 gap-1"
                    style={{
                      backgroundColor: `${tag.color}15`,
                      color: tag.color,
                      borderColor: `${tag.color}30`,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                  </Badge>
                ))}
                {note.tags.length > 2 && (
                  <span className="text-xs text-muted-foreground">+{note.tags.length - 2}</span>
                )}
              </div>
            )}
          </div>
        </div>
        {isTrash ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onRestore && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onRestore(note.id);
                  }}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Restaurar
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(note.id);
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir Permanentemente
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </motion.div>
  );

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-semibold text-foreground truncate">{title}</h2>
            {creatorName && <p className="text-xs text-muted-foreground mt-1">Criado por: {creatorName}</p>}
            {subtitle && <p className="text-sm text-muted-foreground mt-1 truncate">{subtitle}</p>}
            <p className="text-sm text-muted-foreground mt-2">
              {notes.length} {notes.length === 1 ? 'nota' : 'notas'}
            </p>
          </div>
          {onShare && canShare && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onShare}
              className="shrink-0 text-muted-foreground hover:text-foreground"
              title="Compartilhar caderno"
            >
              <Share2 className="w-5 h-5" />
            </Button>
          )}
          {isTrash && onEmptyTrash && (
             <Button
               variant="destructive"
               size="sm"
               onClick={onEmptyTrash}
               className="shrink-0 gap-2"
             >
               <Trash2 className="w-4 h-4" />
               Esvaziar Lixeira
             </Button>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="flex-1 overflow-y-auto p-4">
        {pinnedNotes.length > 0 && (
          <div className="mb-6">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-2">
              Fixadas
            </h4>
            <div className="space-y-1">
              {pinnedNotes.map((note, index) => renderNoteCard(note, index))}
            </div>
          </div>
        )}

        {regularNotes.length > 0 && (
          <div>
            {pinnedNotes.length > 0 && (
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-2">
                Outras
              </h4>
            )}
            <div className="space-y-1">
              {regularNotes.map((note, index) =>
                renderNoteCard(note, index + pinnedNotes.length)
              )}
            </div>
          </div>
        )}

        {notes.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <TagIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground mb-1">Nenhuma nota encontrada</h3>
            <p className="text-sm text-muted-foreground">
              Crie uma nova nota para começar
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
