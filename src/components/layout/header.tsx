import Link from 'next/link';
import { LayoutGrid, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm">
      <div className="flex h-12 sm:h-14 md:h-16 w-full items-center px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="mr-3 sm:mr-4 flex">
          <Link href="/" className="mr-4 sm:mr-6 flex items-center space-x-1.5 sm:space-x-2">
            <LayoutGrid className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <span className="font-bold text-sm sm:text-base font-headline">KANBI</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-1.5 sm:space-x-2">
          <nav className="flex items-center">
            <Button asChild variant="ghost" className="h-8 sm:h-9 md:h-10 text-xs sm:text-sm px-2 sm:px-3 md:px-4">
              <Link href="https://github.com/MuhammadTanveerAbbas/kanbi-ActionBoard" target="_blank" rel="noopener noreferrer">
                <Github className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">GitHub</span>
              </Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
