import { useState, useMemo } from 'react';
import { Note, Attachment } from '@/types';
import { Search, FileText, Image as ImageIcon, Music, Paperclip } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FileListProps {
  notes: Note[];
  selectedFileId?: string;
  onFileSelect: (fileId: string) => void;
}

type FileTab = 'all' | 'media' | 'docs';

export function FileList({ notes, selectedFileId, onFileSelect }: FileListProps) {
  const [activeTab, setActiveTab] = useState<FileTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const allFiles = useMemo(() => {
    return notes.flatMap(note => 
      (note.attachments || []).map(att => ({
        ...att,
        noteTitle: note.title,
        noteId: note.id
      }))
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [notes]);

  const filteredFiles = useMemo(() => {
    let files = allFiles;

    if (activeTab === 'media') {
      files = files.filter(f => f.type === 'image' || f.type === 'audio' || f.type === 'sketch');
    } else if (activeTab === 'docs') {
      files = files.filter(f => f.type === 'file');
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      files = files.filter(f => 
        f.fileName.toLowerCase().includes(query) || 
        f.noteTitle.toLowerCase().includes(query)
      );
    }

    return files;
  }, [allFiles, activeTab, searchQuery]);

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="w-4 h-4" />;
      case 'audio': return <Music className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-4 border-b border-border space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            Arquivos
            <span className="text-sm font-normal text-muted-foreground">{filteredFiles.length}</span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
           <Button 
             variant={activeTab === 'all' ? 'secondary' : 'ghost'} 
             size="sm" 
             onClick={() => setActiveTab('all')}
             className="rounded-full h-7 text-xs"
           >
             Arquivos
           </Button>
           <Button 
             variant={activeTab === 'media' ? 'secondary' : 'ghost'} 
             size="sm" 
             onClick={() => setActiveTab('media')}
             className="rounded-full h-7 text-xs"
           >
             Mídia
           </Button>
           <Button 
             variant={activeTab === 'docs' ? 'secondary' : 'ghost'} 
             size="sm" 
             onClick={() => setActiveTab('docs')}
             className="rounded-full h-7 text-xs"
           >
             Documentos
           </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar arquivo..." 
            className="pl-9 bg-muted/50 border-none shadow-none focus-visible:ring-1"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
            <Paperclip className="w-8 h-8 mb-2 opacity-20" />
            Nenhum arquivo encontrado
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                onClick={() => onFileSelect(file.id)}
                className={cn(
                  "p-4 cursor-pointer hover:bg-muted/50 transition-colors flex items-start gap-3 group",
                  selectedFileId === file.id && "bg-muted"
                )}
              >
                <div className="mt-1 p-2 rounded-lg bg-muted text-muted-foreground group-hover:text-foreground transition-colors">
                  {getFileIcon(file.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium truncate mb-1">
                    {file.fileName}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate mb-1">
                    {file.noteTitle}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>{(file.sizeBytes / 1024).toFixed(1)} KB</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(file.createdAt), { addSuffix: true, locale: ptBR })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
