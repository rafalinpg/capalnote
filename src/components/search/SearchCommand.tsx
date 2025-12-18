import { useEffect, useState } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Note, Notebook } from '@/types';
import { FileText, BookOpen, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SearchCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notes: Note[];
  notebooks: Notebook[];
  onSelectNote: (note: Note) => void;
}

export function SearchCommand({
  open,
  onOpenChange,
  notes,
  notebooks,
  onSelectNote,
}: SearchCommandProps) {
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse recent searches', e);
      }
    }
  }, []);

  const addToRecentSearches = (term: string) => {
    if (!term.trim()) return;
    
    const newSearches = [
      term,
      ...recentSearches.filter((s) => s !== term),
    ].slice(0, 5); // Keep last 5 searches

    setRecentSearches(newSearches);
    localStorage.setItem('recentSearches', JSON.stringify(newSearches));
  };

  const removeFromRecentSearches = (e: React.MouseEvent, term: string) => {
    e.stopPropagation();
    const newSearches = recentSearches.filter((s) => s !== term);
    setRecentSearches(newSearches);
    localStorage.setItem('recentSearches', JSON.stringify(newSearches));
  };

  // Reset query when closed
  useEffect(() => {
    if (!open) {
      setQuery('');
    }
  }, [open]);

  const getNotebookName = (notebookId: string) => {
    return notebooks.find(n => n.id === notebookId)?.name || 'Sem caderno';
  };

  // Manual filtering to ensure strict results and fix "Teste2" issue
  // We only filter if there is a query. If no query, we show all (or handled by CommandGroup logic)
  const filteredNotes = query 
    ? notes.filter((note) => {
        const searchTerms = query.toLowerCase().trim().split(/\s+/);
        const title = note.title.toLowerCase();
        const content = note.contentText.toLowerCase();
        const notebook = getNotebookName(note.notebookId).toLowerCase();
        
        // All terms must match at least one field (AND logic for terms)
        // Or should it be simple includes? User said "autofilter".
        // Let's use simple includes of the full query string or split?
        // Simple includes is safer for "strict" requirement.
        // But usually splitting by space is better for "foo bar" matching "foo" and "bar" in different places.
        // Let's stick to simple string includes for now to be safest against "Teste2" appearing for "xyz".
        const searchContent = `${title} ${content} ${notebook}`;
        return searchTerms.every(term => searchContent.includes(term));
      })
    : notes;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Buscar notas..." 
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        
        {!query && recentSearches.length > 0 && (
          <>
            <CommandGroup heading="Pesquisas recentes">
              {recentSearches.map((term) => (
                <CommandItem
                  key={term}
                  value={`recent-${term}`}
                  onSelect={() => setQuery(term)}
                  className="flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{term}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => removeFromRecentSearches(e, term)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading="Notas">
          {filteredNotes.map((note) => (
            <CommandItem
              key={note.id}
              value={`${note.title} ${note.contentText} ${getNotebookName(note.notebookId)}`}
              onSelect={() => {
                addToRecentSearches(query);
                onSelectNote(note);
                onOpenChange(false);
              }}
              className="flex items-center gap-2 cursor-pointer"
            >
              <FileText className="h-4 w-4 opacity-50" />
              <div className="flex flex-col">
                <span className="font-medium">{note.title}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {getNotebookName(note.notebookId)}
                </span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
