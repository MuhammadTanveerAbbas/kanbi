import Link from 'next/link';
import { LayoutGrid, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export default function Header() {
  const { user } = useAuth();
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-md">
      <div className="flex h-14 sm:h-16 w-full items-center px-4 sm:px-6 lg:px-8">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2 group">
            <LayoutGrid className="h-5 w-5 sm:h-6 sm:w-6 text-primary group-hover:rotate-180 transition-transform duration-500" />
            <span className="font-bold text-base sm:text-lg font-headline">KANBI</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center gap-2">
            {user && (
              <Button asChild variant="default" className="h-9 sm:h-10 text-xs sm:text-sm px-3 sm:px-4">
                <Link href="/dashboard">
                  <LayoutGrid className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
            )}
            <Button asChild variant="ghost" className="h-9 sm:h-10 text-xs sm:text-sm px-3 sm:px-4 hover:bg-primary/10">
              <Link href="https://github.com/MuhammadTanveerAbbas/kanbi-ActionBoard" target="_blank" rel="noopener noreferrer">
                <Github className="mr-2 h-4 w-4" />
                <span className="hidden xs:inline">GitHub</span>
              </Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
