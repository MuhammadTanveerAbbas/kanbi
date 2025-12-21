'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t bg-muted/30 mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            © 2024 KANBI - Portfolio Project by Muhammad Tanveer Abbas
          </div>
          
          <div className="flex gap-6 text-sm">
            <Link 
              href="/privacy" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            <Link 
              href="/terms" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t text-xs text-muted-foreground text-center">
          This is a demonstration project showcasing modern web development practices.
        </div>
      </div>
    </footer>
  );
}