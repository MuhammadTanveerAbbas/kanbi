'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Save, Briefcase, User, FolderKanban, Lightbulb, FileText, Loader2 } from 'lucide-react';
import { Task } from '@/lib/types';

const CATEGORIES = [
  { value: 'work', label: 'Work', icon: Briefcase },
  { value: 'personal', label: 'Personal', icon: User },
  { value: 'project', label: 'Project', icon: FolderKanban },
  { value: 'ideas', label: 'Ideas', icon: Lightbulb },
  { value: 'other', label: 'Other', icon: FileText },
];

const ICONS = [
  { value: 'briefcase', label: 'Briefcase', icon: Briefcase },
  { value: 'user', label: 'Personal', icon: User },
  { value: 'folder', label: 'Folder', icon: FolderKanban },
  { value: 'lightbulb', label: 'Lightbulb', icon: Lightbulb },
  { value: 'file', label: 'File', icon: FileText },
];

interface SaveBoardButtonProps {
  tasks: Task[];
}

export default function SaveBoardButton({ tasks }: SaveBoardButtonProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('other');
  const [icon, setIcon] = useState('file');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Please enter a board name');
      return;
    }

    if (tasks.length === 0) {
      setError('Cannot save an empty board');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/boards/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: name.trim(),
          tasks: tasks,
          category: category,
          icon: icon,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.code === 'RATE_LIMIT_EXCEEDED'
          ? 'Board usage limit exceeded. Please upgrade your plan or wait until tomorrow.'
          : data.error || 'Failed to save board';
        throw new Error(errorMessage);
      }

      setSuccess(true);

      // Dispatch a custom event that dashboard can listen to
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('board-saved', { detail: data }));
      }

      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        setName('');
        setCategory('other');
        setIcon('file');
      }, 1500);
    } catch (err: any) {
      console.error('Save board error:', err);
      setError(err.message || 'Failed to save board');
      setSuccess(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Save className="h-4 w-4" />
          Save Board
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save Your Board</DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <div className="text-green-500 text-xl mb-2">✓</div>
            <p className="text-green-500 font-medium">Board saved successfully!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Board Name
              </label>
              <Input
                placeholder="Enter board name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Category
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => {
                    const CatIcon = cat.icon;
                    return (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex items-center gap-2">
                          <CatIcon className="h-4 w-4" />
                          {cat.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Icon
              </label>
              <div className="flex gap-2">
                {ICONS.map((i) => {
                  const IconComp = i.icon;
                  return (
                    <button
                      key={i.value}
                      type="button"
                      onClick={() => setIcon(i.value)}
                      className={`p-3 rounded-lg border transition-all ${
                        icon === i.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-muted hover:border-primary/50'
                      }`}
                      title={i.label}
                    >
                      <IconComp className="h-5 w-5" />
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <p className="text-xs text-muted-foreground">
              {tasks.length} task{tasks.length !== 1 ? 's' : ''} will be saved
            </p>
          </div>
        )}

        {!success && (
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !name.trim()}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Board
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
