import { Attachment } from '@/types';
import { Button } from '@/components/ui/button';
import { ExternalLink, Download, FileText, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FilePreviewProps {
  attachment: Attachment & { noteTitle: string; noteId: string };
  onOpenNote: (noteId: string) => void;
}

export function FilePreview({ attachment, onOpenNote }: FilePreviewProps) {
  if (!attachment) return null;

  const isImage = attachment.type === 'image';

  const handleDownload = async () => {
    try {
      const response = await fetch(attachment.fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  return (
    <div className="h-full flex flex-col bg-card">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
         <div className="flex items-center gap-2 text-sm text-muted-foreground">
           <span className="truncate max-w-[200px]">{attachment.noteTitle}</span>
           <span>›</span>
           <span className="truncate max-w-[200px] text-foreground font-medium">{attachment.fileName}</span>
         </div>
         <div className="flex items-center gap-2">
            <Button onClick={() => onOpenNote(attachment.noteId)} size="sm" className="gap-2">
              Abrir nota
            </Button>
         </div>
      </div>

      <div className="flex-1 overflow-auto p-8 flex flex-col items-center">
         {isImage ? (
           <div className="max-w-full max-h-full shadow-lg rounded-lg overflow-hidden bg-background">
             <img src={attachment.fileUrl} alt={attachment.fileName} className="max-w-full max-h-[calc(100vh-200px)] object-contain" />
           </div>
         ) : (
           <div className="flex flex-col items-center justify-center flex-1 text-center max-w-md">
             <div className="w-24 h-24 rounded-2xl bg-muted flex items-center justify-center mb-6">
               <FileText className="w-12 h-12 text-muted-foreground" />
             </div>
             <h2 className="text-xl font-semibold mb-2">{attachment.fileName}</h2>
             <p className="text-sm text-muted-foreground mb-6">
               {(attachment.sizeBytes / 1024).toFixed(1)} KB • {attachment.mimeType}
             </p>
             <div className="flex gap-3">
               <Button onClick={() => window.open(attachment.fileUrl, '_blank')} variant="outline">
                 <ExternalLink className="w-4 h-4 mr-2" />
                 Visualizar
               </Button>
               <Button onClick={handleDownload}>
                 <Download className="w-4 h-4 mr-2" />
                 Baixar
               </Button>
             </div>
           </div>
         )}
         
         <div className="mt-8 w-full max-w-2xl bg-muted/30 rounded-lg p-4 border border-border">
            <h3 className="text-sm font-medium mb-3">Informações</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
               <div>
                 <span className="text-muted-foreground block mb-1">Nota de origem</span>
                 <Button variant="link" className="p-0 h-auto font-normal text-foreground hover:underline" onClick={() => onOpenNote(attachment.noteId)}>
                   {attachment.noteTitle}
                 </Button>
               </div>
               <div>
                 <span className="text-muted-foreground block mb-1">Data de envio</span>
                 <span>{format(new Date(attachment.createdAt), "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}</span>
               </div>
               <div>
                 <span className="text-muted-foreground block mb-1">Tipo</span>
                 <span>{attachment.mimeType}</span>
               </div>
               <div>
                 <span className="text-muted-foreground block mb-1">Tamanho</span>
                 <span>{(attachment.sizeBytes / 1024).toFixed(1)} KB</span>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
