import Link from 'next/link';
import { LayoutGrid, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm">
      <div className="flex h-16 w-full items-center px-4 sm:px-6 lg:px-8">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <LayoutGrid className="h-6 w-6 text-primary" />
            <span className="font-bold sm:inline-block font-headline">KANBI</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center">
            <Button asChild variant="ghost">
              <Link href="https://github.com/MuhammadTanveerAbbas/kanbi-ActionBoard" target="_blank" rel="noopener noreferrer">
                <Github className="mr-2 h-4 w-4" />
                GitHub
              </Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
