'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';

const shortcuts = [
  { key: 'Ctrl/⌘ + K', action: 'Open search' },
  { key: 'Ctrl/⌘ + N', action: 'New board' },
  { key: 'Ctrl/⌘ + S', action: 'Save board' },
  { key: 'Ctrl/⌘ + E', action: 'Export board' },
  { key: 'Ctrl/⌘ + Z', action: 'Undo' },
  { key: 'Ctrl/⌘ + Y', action: 'Redo' },
  { key: '?', action: 'Show shortcuts' },
];

export default function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-110 transition-transform z-50"
        title="Keyboard shortcuts (?)"
      >
        <Keyboard className="h-5 w-5" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {shortcuts.map((shortcut) => (
              <div key={shortcut.key} className="flex items-center justify-between py-2 border-b">
                <span className="text-sm">{shortcut.action}</span>
                <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded">{shortcut.key}</kbd>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
