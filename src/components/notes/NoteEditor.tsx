import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Code,
  Image,
  Paperclip,
  Mic,
  Share2,
  MoreHorizontal,
  Pin,
  Trash2,
  History,
  Tag,
  ChevronDown,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Note, Notebook } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { mockNotebooks, mockTags } from '@/data/mockData';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NoteEditorProps {
  note: Note;
  onClose: () => void;
  onUpdate: (note: Note) => void;
}

export function NoteEditor({ note, onClose, onUpdate }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.contentRich);
  const [isPinned, setIsPinned] = useState(note.isPinned);
  const [selectedTags, setSelectedTags] = useState(note.tags);
  const [showTagSelector, setShowTagSelector] = useState(false);

  const notebook = mockNotebooks.find((n) => n.id === note.notebookId);

  type ToolbarSeparator = { type: 'separator'; icon?: never; label?: never };
  type ToolbarButton = { type?: 'button'; icon: React.ComponentType<{ className?: string }>; label: string; shortcut?: string };
  type ToolbarItem = ToolbarSeparator | ToolbarButton;

  const toolbarItems: ToolbarItem[] = [
    { type: 'button', icon: Bold, label: 'Negrito', shortcut: 'Ctrl+B' },
    { type: 'button', icon: Italic, label: 'Itálico', shortcut: 'Ctrl+I' },
    { type: 'button', icon: Underline, label: 'Sublinhado', shortcut: 'Ctrl+U' },
    { type: 'separator' },
    { type: 'button', icon: List, label: 'Lista' },
    { type: 'button', icon: ListOrdered, label: 'Lista Numerada' },
    { type: 'button', icon: Quote, label: 'Citação' },
    { type: 'button', icon: Code, label: 'Código' },
    { type: 'separator' },
    { type: 'button', icon: Image, label: 'Imagem' },
    { type: 'button', icon: Paperclip, label: 'Anexo' },
    { type: 'button', icon: Mic, label: 'Áudio' },
  ];

  const toggleTag = (tagId: string) => {
    const tag = mockTags.find((t) => t.id === tagId);
    if (!tag) return;

    if (selectedTags.find((t) => t.id === tagId)) {
      setSelectedTags(selectedTags.filter((t) => t.id !== tagId));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="h-full flex flex-col bg-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
                <span className="w-2 h-2 rounded-full bg-primary" />
                {notebook?.name || 'Sem caderno'}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {mockNotebooks
                .filter((n) => !n.isArchived)
                .map((n) => (
                  <DropdownMenuItem key={n.id}>
                    <span className="w-2 h-2 rounded-full bg-primary mr-2" />
                    {n.name}
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <span className="text-muted-foreground">•</span>

          <span className="text-sm text-muted-foreground">
            Editado {formatDistanceToNow(note.updatedAt, { addSuffix: true, locale: ptBR })}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsPinned(!isPinned)}
            className={cn(isPinned && 'text-primary')}
          >
            <Pin className={cn('w-4 h-4', isPinned && 'fill-current')} />
          </Button>

          <Button variant="ghost" size="icon">
            <History className="w-4 h-4" />
          </Button>

          <Button variant="ghost" size="icon">
            <Share2 className="w-4 h-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Pin className="w-4 h-4 mr-2" />
                {isPinned ? 'Desafixar' : 'Fixar'} nota
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share2 className="w-4 h-4 mr-2" />
                Compartilhar
              </DropdownMenuItem>
              <DropdownMenuItem>
                <History className="w-4 h-4 mr-2" />
                Ver histórico
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir nota
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="h-6 mx-2" />

          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 px-6 py-2 border-b border-border bg-muted/30">
        {toolbarItems.map((item, index) => {
          if (item.type === 'separator') {
            return <Separator key={index} orientation="vertical" className="h-6 mx-1" />;
          }
          const buttonItem = item as ToolbarButton;
          const IconComponent = buttonItem.icon;
          return (
            <Button
              key={index}
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              title={buttonItem.label}
            >
              <IconComponent className="w-4 h-4" />
            </Button>
          );
        })}
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título da nota"
            className={cn(
              'w-full text-3xl font-semibold bg-transparent border-none outline-none',
              'placeholder:text-muted-foreground/50 mb-6'
            )}
          />

          {/* Tags */}
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            {selectedTags.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="gap-1.5 pr-1.5 cursor-pointer"
                style={{
                  backgroundColor: `${tag.color}15`,
                  color: tag.color,
                  borderColor: `${tag.color}30`,
                }}
                onClick={() => toggleTag(tag.id)}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                {tag.name}
                <X className="w-3 h-3 ml-1 opacity-60 hover:opacity-100" />
              </Badge>
            ))}
            <DropdownMenu open={showTagSelector} onOpenChange={setShowTagSelector}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 gap-1 text-muted-foreground">
                  <Tag className="w-3.5 h-3.5" />
                  Adicionar etiqueta
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {mockTags.map((tag) => (
                  <DropdownMenuItem
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={cn(
                      selectedTags.find((t) => t.id === tag.id) && 'bg-accent'
                    )}
                  >
                    <span
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Content */}
          <div
            className={cn(
              'prose prose-lg max-w-none',
              'dark:prose-invert',
              'prose-headings:font-semibold prose-headings:text-foreground',
              'prose-p:text-foreground/90 prose-p:leading-relaxed',
              'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
              'prose-strong:text-foreground prose-strong:font-semibold',
              'prose-code:text-accent-foreground prose-code:bg-accent prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded',
              'prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground',
              'prose-li:text-foreground/90',
              'font-serif'
            )}
          >
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Comece a escrever sua nota..."
              className={cn(
                'w-full min-h-[60vh] bg-transparent border-none outline-none resize-none',
                'placeholder:text-muted-foreground/50',
                'leading-relaxed'
              )}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-muted/30">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>
            Criado em {format(note.createdAt, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </span>
          <span>•</span>
          <span>{note.contentText.split(' ').length} palavras</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            Descartar
          </Button>
          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
            Salvar
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
