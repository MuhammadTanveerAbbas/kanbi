"use client";

import { ArrowRight, Github, LayoutGrid } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative border-t border-border/40 bg-gradient-to-b from-black via-[#0a0a0a] to-black">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(100,100,100,0.08),transparent_60%)] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 py-16 sm:py-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 sm:gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <LayoutGrid className="h-6 w-6 text-primary" />
              </div>
              <span className="font-bold text-2xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                KANBI
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
              Transform messy notes into organized Kanban boards for seamless
              task management. Start free, upgrade what need.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-base mb-4 text-foreground">
              Product
            </h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/#features"
                  className="hover:text-primary transition-colors inline-flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 rounded-full bg-primary/50 group-hover:bg-primary transition-colors" />
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="/sign-up"
                  className="hover:text-primary transition-colors inline-flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 rounded-full bg-primary/50 group-hover:bg-primary transition-colors" />
                  Get Started
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Resources */}
          <div>
            <h4 className="font-semibold text-base mb-4 text-foreground">
              Legal
            </h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-primary transition-colors inline-flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 rounded-full bg-primary/50 group-hover:bg-primary transition-colors" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="hover:text-primary transition-colors inline-flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 rounded-full bg-primary/50 group-hover:bg-primary transition-colors" />
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-border/40 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} KANBI. All rights reserved.
          </p>
          <p className="text-xs">
            Questions?{" "}
            <a
              href="mailto:muhammadtanveerabbas.dev@gmail.com"
              className="text-primary hover:underline transition-colors"
            >
              Contact us
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
