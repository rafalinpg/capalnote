import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { History, RotateCcw, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NoteVersion } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface HistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  noteId: string;
  getHistory: (noteId: string) => Promise<NoteVersion[]>;
  restoreVersion: (noteId: string, versionId: string) => Promise<any>;
}

export function HistoryDialog({ open, onOpenChange, noteId, getHistory, restoreVersion }: HistoryDialogProps) {
  const [versions, setVersions] = useState<NoteVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && noteId) {
      loadHistory();
    }
  }, [open, noteId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await getHistory(noteId);
      // Sort by version number descending
      setVersions(data.sort((a, b) => b.versionNo - a.versionNo));
    } catch (error) {
      console.error('Failed to load history:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o histórico de versões.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (version: NoteVersion) => {
    if (!confirm(`Deseja restaurar a versão ${version.versionNo}? O conteúdo atual será substituído.`)) {
      return;
    }

    try {
      await restoreVersion(noteId, version.id);
      toast({
        title: "Sucesso",
        description: `Versão ${version.versionNo} restaurada com sucesso.`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to restore version:', error);
      toast({
        title: "Erro",
        description: "Não foi possível restaurar a versão.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Histórico de Versões
          </DialogTitle>
          <DialogDescription>
            Visualize e restaure versões anteriores desta nota.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 mt-4">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <span className="text-muted-foreground">Carregando histórico...</span>
            </div>
          ) : versions.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <span className="text-muted-foreground">Nenhuma versão anterior encontrada.</span>
            </div>
          ) : (
            <ScrollArea className="h-[50vh] pr-4">
              <div className="space-y-4">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className="flex flex-col gap-2 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">Versão {version.versionNo}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDistanceToNow(version.createdAt, { addSuffix: true, locale: ptBR })}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore(version)}
                        className="gap-2 h-8"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Restaurar
                      </Button>
                    </div>
                    
                    <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md line-clamp-3">
                      {version.contentText || "Sem conteúdo de texto"}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
