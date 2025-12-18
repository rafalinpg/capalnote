import { motion } from 'framer-motion';
import { FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onCreateNote: () => void;
}

export function EmptyState({ onCreateNote }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="h-full flex flex-col items-center justify-center text-center p-8"
    >
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6">
        <FileText className="w-10 h-10 text-primary" />
      </div>
      
      <h2 className="text-xl font-semibold text-foreground mb-2">
        Selecione uma nota para visualizar
      </h2>
      
      <p className="text-muted-foreground max-w-md mb-6">
        Escolha uma nota da lista ao lado ou crie uma nova para começar a organizar suas ideias.
      </p>
      
      <Button onClick={onCreateNote} className="gap-2">
        <Plus className="w-4 h-4" />
        Nova Nota
      </Button>
    </motion.div>
  );
}
