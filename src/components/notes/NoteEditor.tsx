import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import UnderlineExtension from '@tiptap/extension-underline';
import ImageExtension from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import FontFamily from '@tiptap/extension-font-family';
import CharacterCount from '@tiptap/extension-character-count';
import { TextStyle } from '@tiptap/extension-text-style';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Code,
  Image as ImageIcon,
  Paperclip,
  Mic,
  Share2,
  MoreHorizontal,
  Pin,
  Trash2,
  Tag,
  ChevronDown,
  X,
  FileText,
  Download,
  Heading1,
  Heading2,
  Heading3,
  Type,
  Check,
  AlertCircle,
  Printer,
} from 'lucide-react';
import { Extension } from '@tiptap/core';
import { cn } from '@/lib/utils';
import { Note, Notebook, Tag as TagType, Attachment } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { useToast } from '@/hooks/use-toast';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (size: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
  }
}

export const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return {
      types: ['textStyle'],
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize })
          .run();
      },
      unsetFontSize: () => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize: null })
          .removeEmptyTextStyle()
          .run();
      },
    };
  },
});

interface NoteEditorProps {
  note: Note;
  notebooks: Notebook[];
  tags: TagType[];
  onClose: () => void;
  onUpdate: (note: Partial<Note> & { id: string }) => Promise<void> | void;
  onDelete: (noteId: string) => void;
  onUploadAttachment: (file: File, type?: 'image' | 'audio' | 'file' | 'sketch') => Promise<Attachment>;
  onDeleteAttachment: (attachmentId: string) => Promise<void>;
  onShare: () => void;
}

const buildUniqueImageFile = (file: File) => {
  const extensionFromType = file.type.split('/')[1] || 'png';
  const originalExtension = file.name.includes('.') ? file.name.split('.').pop() : '';
  const extension = (originalExtension || extensionFromType).replace(/[^a-zA-Z0-9]/g, '') || 'png';
  const uniqueId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return new File([file], `clipboard-${uniqueId}.${extension}`, {
    type: file.type || `image/${extensionFromType}`,
    lastModified: file.lastModified || Date.now(),
  });
};

export function NoteEditor({ note, notebooks, tags, onClose, onUpdate, onDelete, onUploadAttachment, onDeleteAttachment, onShare }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [isPinned, setIsPinned] = useState(note.isPinned);
  const [selectedTags, setSelectedTags] = useState(note.tags);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [selectedNotebookId, setSelectedNotebookId] = useState(note.notebookId);
  const [localAttachments, setLocalAttachments] = useState<Attachment[]>(note.attachments || []);
  const { toast } = useToast();

  const role = note.userRole || 'viewer';

  const canEdit = (role === 'owner' || role === 'editor' || role === 'full_access') && !note.isTrashed;
  const canShare = (role === 'owner' || role === 'full_access') && !note.isTrashed;
  const canDelete = role === 'owner';

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleSaveRef = useRef<() => void>(() => {});

  const notebook = notebooks.find((n) => n.id === selectedNotebookId);
  const sourceNotebook = notebooks.find((n) => n.id === note.notebookId);
  const canMoveFromSource = (sourceNotebook?.userRole === 'owner' || sourceNotebook?.userRole === 'full_access') && !note.isTrashed;

  const insertUploadedImage = useCallback(async (view: Parameters<NonNullable<NonNullable<ReturnType<typeof useEditor>>['options']['editorProps']>['handlePaste']>[0], file: File) => {
    const uploadFile = file.name.toLowerCase() === 'image.png' ? buildUniqueImageFile(file) : file;
    const attachment = await onUploadAttachment(uploadFile, 'image');
    const { schema } = view.state;
    const node = schema.nodes.image.create({ src: attachment.fileUrl });
    const transaction = view.state.tr.replaceSelectionWith(node);
    view.dispatch(transaction);
    setLocalAttachments(prev => [...prev, attachment]);
  }, [onUploadAttachment]);

  const editor = useEditor({
    editable: canEdit,
    extensions: [
      StarterKit,
      UnderlineExtension,
      ImageExtension.configure({
        inline: true,
        allowBase64: true,
      }),
      LinkExtension.configure({
        openOnClick: true,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
        },
      }),
      Placeholder.configure({
        placeholder: 'Comece a escrever sua nota...',
      }),
      TextStyle,
      FontFamily,
      FontSize,
      CharacterCount,
    ],
    content: note.contentRich || note.contentText || '',
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none dark:prose-invert prose-headings:font-semibold prose-headings:text-foreground prose-p:text-foreground/90 prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-strong:font-semibold prose-code:text-accent-foreground prose-code:bg-accent prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-li:text-foreground/90 font-serif outline-none',
      },
      handleDrop: (view, event, _slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            insertUploadedImage(view, file).catch(error => {
              console.error('Failed to upload image:', error);
              alert('Erro ao enviar imagem');
            });
            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (items) {
          for (const item of items) {
            if (item.type.startsWith('image/')) {
              const file = item.getAsFile();
              if (file) {
                insertUploadedImage(view, file).catch(error => {
                  console.error('Failed to upload image:', error);
                  alert('Erro ao enviar imagem');
                });
                return true;
              }
            }
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      // Auto-save logic handled by useEffect
    },
  }, [canEdit, insertUploadedImage]);

  const isFirstRender = useRef(true);

  // Sync editor content when note changes
  useEffect(() => {
    if (editor && note.id) {
      // Only update if content is different to avoid cursor jumps
      const currentContent = editor.getHTML();
      if (currentContent !== note.contentRich && note.contentRich) {
         editor.commands.setContent(note.contentRich);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.id, editor]); // Removing note.contentRich to avoid loops, mostly for switching notes

  const handleSave = useCallback(async () => {
    if (!editor) return;

    // Avoid saving if it is the first render
    if (isFirstRender.current) return;

    const newContentRich = editor.getHTML();
    
    const titleToSave = !title || title.trim() === '' ? 'Sem título' : title;

    // Check if there are actual changes
    const hasChanges = 
      titleToSave !== note.title ||
      newContentRich !== note.contentRich ||
      isPinned !== note.isPinned ||
      selectedNotebookId !== note.notebookId ||
      localAttachments.length !== (note.attachments || []).length ||
      JSON.stringify(localAttachments.map(a => a.id).sort()) !== JSON.stringify((note.attachments || []).map(a => a.id).sort()) ||
      JSON.stringify(selectedTags.map(t => t.id).sort()) !== JSON.stringify(note.tags.map(t => t.id).sort());

    if (!hasChanges) return;

    try {
      await onUpdate({
        ...note,
        title: titleToSave,
        contentRich: newContentRich,
        contentText: editor.getText(),
        isPinned,
        tags: selectedTags,
        notebookId: selectedNotebookId,
        attachments: localAttachments,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error("Auto-save failed:", error);
      toast({
        title: "Erro ao salvar",
        description: `Falha ao salvar as alterações automaticamente. ${error instanceof Error ? error.message : ''}`,
        variant: "destructive",
      });
    }
  }, [editor, onUpdate, note, title, isPinned, selectedTags, selectedNotebookId, localAttachments, toast]);

  useEffect(() => {
    handleSaveRef.current = handleSave;
  }, [handleSave]);

  useEffect(() => {
    // Set isFirstRender to false after a short delay to allow initial content set
    // This prevents the initial content set from triggering a save
    const timeout = setTimeout(() => {
      isFirstRender.current = false;
    }, 1000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!editor) return;

    const handleEditorUpdate = () => {
      if (isFirstRender.current) return;
      
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        handleSaveRef.current();
      }, 1000); // Auto-save after 1 second of inactivity
    };

    editor.on('update', handleEditorUpdate);

    return () => {
      editor.off('update', handleEditorUpdate);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [editor]);

  // Auto-save when title changes
  useEffect(() => {
    if (isFirstRender.current) return;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      handleSaveRef.current();
    }, 1000);
  }, [title]);

  const handleDelete = () => {
    onDelete(note.id);
    onClose();
  };

  const toggleTag = (tagId: string) => {
    const tag = tags.find((t) => t.id === tagId);
    if (!tag) return;

    if (selectedTags.find((t) => t.id === tagId)) {
      setSelectedTags(selectedTags.filter((t) => t.id !== tagId));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Auto-save when tags change
  useEffect(() => {
    if (isFirstRender.current) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      handleSaveRef.current();
    }, 1000);

  }, [selectedTags]);

  const togglePin = useCallback(() => {
    const newPinned = !isPinned;
    setIsPinned(newPinned);
    
    const newContentRich = editor?.getHTML() || '';
    const titleToSave = !title || title.trim() === '' ? 'Sem título' : title;
    
    const hasContentChanges = 
      titleToSave !== note.title ||
      newContentRich !== note.contentRich;

    if (hasContentChanges) {
        // If there are content changes, send full update
        onUpdate({
            ...note,
            title: titleToSave,
            contentRich: newContentRich,
            contentText: editor?.getText() || '',
            isPinned: newPinned,
            tags: selectedTags,
            notebookId: selectedNotebookId,
            attachments: localAttachments,
            updatedAt: new Date(),
        });
    } else {
        // If only pinning, send ONLY isPinned
        onUpdate({
            id: note.id,
            isPinned: newPinned,
        });
    }
  }, [isPinned, note, title, editor, onUpdate, selectedTags, selectedNotebookId, localAttachments]);

  const addImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && editor) {
        try {
          const attachment = await onUploadAttachment(file, 'image');
          editor.chain().focus().setImage({ src: attachment.fileUrl }).run();
          setLocalAttachments(prev => [...prev, attachment]);
        } catch (error) {
          console.error('Failed to upload image:', error);
          alert('Erro ao enviar imagem');
        }
      }
    };
    input.click();
  };

  const addAttachment = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.odc,.txt';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const newAttachment = await onUploadAttachment(file);
          setLocalAttachments(prev => [...prev, newAttachment]);
        } catch (error) {
          console.error('Failed to upload attachment:', error);
          alert('Erro ao enviar anexo');
        }
      }
    };
    input.click();
  };

  const removeAttachment = async (id: string) => {
    try {
      await onDeleteAttachment(id);
      setLocalAttachments(localAttachments.filter(a => a.id !== id));
    } catch (error) {
      console.error('Failed to delete attachment:', error);
      alert('Erro ao excluir anexo');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!editor) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="h-full flex flex-col bg-card"
    >
      <div id="print-container" style={{ display: 'none' }}>
        <h1 style={{ fontSize: '2em', marginBottom: '1em', fontWeight: 'bold' }}>{title || 'Sem título'}</h1>
        <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 border-b border-border gap-4">
        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={!canEdit}>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto px-2 py-1 md:px-3 md:py-2 gap-2 text-muted-foreground shrink-0"
                onClick={(e) => {
                  if (!canMoveFromSource) {
                    e.preventDefault();
                    toast({
                      title: "Não permitido",
                      description: "Você não tem permissão total na pasta atual para mover esta nota.",
                      variant: "destructive",
                    });
                  }
                }}
              >
                <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                <span className="text-sm font-medium truncate max-w-[100px] md:max-w-none">
                  {notebook?.name || 'Sem caderno'}
                </span>
                <ChevronDown className="w-3 h-3 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto">
              {notebooks
                .filter((n) => !n.isArchived)
                .map((n) => {
                  const isCurrent = n.id === note.notebookId;
                  const canMoveToDestination = n.userRole === 'owner' || n.userRole === 'full_access';
                  const disabled = isCurrent || !canMoveToDestination;

                  return (
                    <DropdownMenuItem
                      key={n.id}
                      disabled={disabled}
                      onClick={async () => {
                        if (!canMoveFromSource) {
                          toast({
                            title: "Não permitido",
                            description: "Você não tem permissão total na pasta atual.",
                            variant: "destructive",
                          });
                          return;
                        }

                        if (!canMoveToDestination) {
                          toast({
                            title: "Não permitido",
                            description: "Você não tem permissão total na pasta de destino.",
                            variant: "destructive",
                          });
                          return;
                        }

                        try {
                          await onUpdate({ id: note.id, notebookId: n.id });
                          setSelectedNotebookId(n.id);
                          toast({
                            title: "Nota movida",
                            description: `Movida para "${n.name}".`,
                          });
                        } catch (error) {
                          toast({
                            title: "Erro ao mover",
                            description: error instanceof Error ? error.message : "Não foi possível mover a nota.",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      <span className="truncate">{n.name}</span>
                    </DropdownMenuItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>

          <span className="hidden md:inline text-muted-foreground">•</span>

          <span className="text-xs md:text-sm text-muted-foreground truncate">
            Editado {formatDistanceToNow(note.updatedAt, { addSuffix: true, locale: ptBR })}
            {note.lastEditedBy && <span className="hidden md:inline"> por {note.lastEditedBy}</span>}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePin}
            title={isPinned ? 'Desafixar nota' : 'Fixar nota'}
            disabled={!canEdit}
            className="hidden md:inline-flex"
          >
            <Pin className={cn("w-4 h-4", isPinned && "fill-primary text-primary")} />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={togglePin} disabled={!canEdit}>
                <Pin className="w-4 h-4 mr-2" />
                {isPinned ? 'Desafixar' : 'Fixar'} nota
              </DropdownMenuItem>
              {canShare && (
                <DropdownMenuItem onClick={onShare}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartilhar
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </DropdownMenuItem>
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onClick={handleDelete}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir nota
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="h-6 mx-2 hidden md:block" />

          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      {canEdit && (
        <div className="flex items-center gap-1 px-6 py-2 border-b border-border bg-muted/30 overflow-x-auto">
          <Button
          variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
          size="icon"
          className="w-8 h-8 shrink-0"
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Negrito (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
          size="icon"
          className="w-8 h-8 shrink-0"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Itálico (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          variant={editor.isActive('underline') ? 'secondary' : 'ghost'}
          size="icon"
          className="w-8 h-8 shrink-0"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Sublinhado (Ctrl+U)"
        >
          <Underline className="w-4 h-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2 gap-1" title="Tamanho da fonte">
              <span className="text-sm min-w-[1.5rem] text-center">
                {(editor.getAttributes('textStyle').fontSize || '16px').replace('px', '')}
              </span>
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-h-60 overflow-y-auto">
            {[8, 9, 10, 12, 14, 15, 16, 18, 20, 24, 30, 36, 48, 64, 72, 96].map((size) => (
              <DropdownMenuItem
                key={size}
                onClick={() => editor.chain().focus().setFontSize(`${size}px`).run()}
                className="flex justify-between"
              >
                <span>{size}</span>
                {editor.isActive('textStyle', { fontSize: `${size}px` }) && (
                  <Check className="w-4 h-4" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2 gap-1" title="Fonte">
              <Type className="w-4 h-4" />
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => editor.chain().focus().unsetFontFamily().run()}>
              Padrão
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setFontFamily('serif').run()}>
              <span className="font-serif">Serif</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setFontFamily('monospace').run()}>
              <span className="font-mono">Monospace</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setFontFamily('cursive').run()}>
              <span style={{ fontFamily: 'cursive' }}>Cursive</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <Button
          variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
          size="icon"
          className="w-8 h-8 shrink-0"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Lista"
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
          size="icon"
          className="w-8 h-8 shrink-0"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Lista Numerada"
        >
          <ListOrdered className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 shrink-0"
          onClick={addImage}
          title="Inserir Imagem"
        >
          <ImageIcon className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 shrink-0"
          onClick={addAttachment}
          title="Anexar Arquivo"
        >
          <Paperclip className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 shrink-0"
          title="Gravar Áudio (Em breve)"
        >
          <Mic className="w-4 h-4 opacity-50" />
        </Button>
      </div>
      )}

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {note.isTrashed && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Nota na Lixeira</AlertTitle>
              <AlertDescription>
                Esta nota está na lixeira e não pode ser editada. Restaure-a para fazer alterações.
              </AlertDescription>
            </Alert>
          )}

          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título da nota"
            disabled={!canEdit}
            className={cn(
              'w-full text-3xl font-semibold bg-transparent border-none outline-none',
              'placeholder:text-muted-foreground/50 mb-6',
              !canEdit && 'cursor-not-allowed opacity-80'
            )}
          />

          {/* Tags */}
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            {selectedTags.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className={cn(
                  "gap-1.5 pr-1.5",
                  canEdit ? "cursor-pointer" : "cursor-default"
                )}
                style={{
                  backgroundColor: `${tag.color}15`,
                  color: tag.color,
                  borderColor: `${tag.color}30`,
                }}
                onClick={() => canEdit && toggleTag(tag.id)}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                {tag.name}
                {canEdit && <X className="w-3 h-3 ml-1 opacity-60 hover:opacity-100" />}
              </Badge>
            ))}
            {canEdit && (
              <DropdownMenu open={showTagSelector} onOpenChange={setShowTagSelector}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 gap-1 text-muted-foreground">
                    <Tag className="w-3.5 h-3.5" />
                    Adicionar etiqueta
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {tags.map((tag) => (
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
            )}
          </div>

          {/* Attachments List */}
          {localAttachments.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {localAttachments.map((att) => (
                <div 
                  key={att.id}
                  className="flex items-center gap-2 bg-muted/50 rounded-md px-3 py-2 border border-border group"
                >
                  <FileText className="w-4 h-4 text-primary" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium truncate max-w-[150px]">{att.fileName}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {(att.sizeBytes / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <div className="flex items-center ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <Button 
                       variant="ghost" 
                       size="icon" 
                       className="h-6 w-6"
                       onClick={() => window.open(att.fileUrl, '_blank')}
                     >
                        <Download className="w-3 h-3" />
                     </Button>
                     {canEdit && (
                       <Button 
                         variant="ghost" 
                         size="icon" 
                         className="h-6 w-6 text-destructive hover:text-destructive"
                         onClick={(e) => {
                           e.preventDefault();
                           e.stopPropagation();
                           removeAttachment(att.id);
                         }}
                       >
                          <X className="w-3 h-3" />
                       </Button>
                     )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tiptap Editor */}
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-muted/30">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>
            Criado em {format(note.createdAt, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </span>
          <span>•</span>
          <span>{editor.storage.characterCount?.words?.() || 0} palavras</span>
        </div>
      </div>
    </motion.div>
  );
}
