'use client';

import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';

export default function SearchBar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    if (query.length > 0) {
      fetch(`/api/saved?search=${query}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed');
          return res.json();
        })
        .then(data => setResults(data.boards || []))
        .catch(() => setResults([]));
    } else {
      setResults([]);
    }
  }, [query]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground border rounded-lg hover:bg-accent transition-colors w-full max-w-xs"
      >
        <Search className="h-4 w-4" />
        <span>Search boards...</span>
        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 max-w-2xl">
          <DialogTitle className="sr-only">Search Boards</DialogTitle>
          <div className="flex items-center border-b px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search boards..."
              className="border-0 focus-visible:ring-0 h-12"
              autoFocus
            />
            {query && (
              <button onClick={() => setQuery('')} className="p-2">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto p-2">
            {results.length === 0 && query && (
              <p className="text-center text-sm text-muted-foreground py-8">No boards found</p>
            )}
            {results.map((board) => (
              <button
                key={board.id}
                onClick={() => {
                  router.push(`/dashboard/board?load=${board.id}`);
                  setOpen(false);
                }}
                className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors"
              >
                <p className="font-medium">{board.title || 'Untitled'}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(board.created_at).toLocaleDateString()}
                </p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
