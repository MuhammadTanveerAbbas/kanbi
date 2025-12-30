"use client";

import Link from "next/link";
import { Github, ExternalLink, LayoutGrid } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t bg-black">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-primary" />
              <span className="font-bold text-lg">KANBI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Transform notes into organized tasks with AI-powered Kanban boards.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/board" className="hover:text-primary transition-colors">Try KANBI</Link></li>
              <li><Link href="/#features" className="hover:text-primary transition-colors">Features</Link></li>
              <li><Link href="/#faq" className="hover:text-primary transition-colors">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Connect</h4>
            <div className="flex gap-4">
              <a
                href="https://github.com/MuhammadTanveerAbbas/kanbi-ActionBoard"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://muhammadtanveerabbas.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Portfolio"
              >
                <ExternalLink className="h-5 w-5" />
              </a>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Built by Muhammad Tanveer Abbas
            </p>
          </div>
        </div>

        <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} KANBI. Open source under MIT License.
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Next.js</span>
            <span>•</span>
            <span>TypeScript</span>
            <span>•</span>
            <span>Tailwind CSS</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
