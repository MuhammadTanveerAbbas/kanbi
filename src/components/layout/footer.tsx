"use client";

import Link from "next/link";
import { Github, ExternalLink, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Footer() {
  return (
    <footer className="border-t border-primary/20 bg-black mt-12">
      <div className="container mx-auto px-4 py-6 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8">
          {/* Brand Section */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-bold text-white">KANBI</h3>
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary border-primary/20 text-xs"
              >
                Free Tool
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xs">
              AI powered task management that transforms messy notes into
              organized Kanban boards.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-sm sm:text-base font-semibold text-white">
              Quick Links
            </h4>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <Link
                href="/board"
                className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Try KANBI
              </Link>
              <Link
                href="/privacy"
                className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </div>

          {/* Developer */}
          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-sm sm:text-base font-semibold text-white">
              Developer
            </h4>
            <div className="space-y-2">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Muhammad Tanveer Abbas
              </p>
              <div className="flex gap-2 sm:gap-3">
                <a
                  href="https://github.com/MuhammadTanveerAbbas/kanbi-ActionBoard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Github className="h-4 w-4" />
                </a>
                <a
                  href="https://muhammadtanveerabbas.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-primary/20 pt-4 sm:pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
              <span>© 2025 KANBI. Built with</span>
              <Heart className="h-3 w-3 text-muted-foreground fill-current" />
              <span>for productivity</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Next.js</span>
              <span>•</span>
              <span>TypeScript</span>
              <span>•</span>
              <span>Tailwind CSS</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
