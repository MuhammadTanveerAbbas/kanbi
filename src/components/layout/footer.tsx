"use client";

import { LayoutGrid, Mail, Linkedin, Twitter } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border/40 bg-gradient-to-b from-black/50 to-black/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-8 sm:py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-8 sm:gap-10 md:gap-12 mb-8">
          {/* Brand */}
          <div className="flex flex-col gap-3 sm:col-span-2 md:col-span-4">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-primary" />
              <span className="font-bold text-base">KANBI</span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              AI powered task management for productive freelancers. Extract
              tasks from notes, emails, and PDFs. Get organized in seconds with
              intelligent prioritization and burnout prevention.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-3 md:col-span-3 md:col-start-7">
            <h3 className="text-xs sm:text-sm font-semibold text-white">
              Resources
            </h3>
            <div className="flex flex-col gap-2">
              <Link
                href="/pricing"
                className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Pricing
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

          {/* Contact */}
          <div className="flex flex-col gap-3 md:col-span-3 md:col-start-10">
            <h3 className="text-xs sm:text-sm font-semibold text-white">
              Connect
            </h3>
            <div className="flex flex-col gap-3">
              <a
                href="mailto:support@kanbi.app"
                className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span>Email</span>
              </a>
              <a
                href="https://linkedin.com/in/MuhammadTanveerAbbas"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Linkedin className="h-4 w-4 flex-shrink-0" />
                <span>LinkedIn</span>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Twitter className="h-4 w-4 flex-shrink-0" />
                <span>Twitter</span>
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/40 pt-6 sm:pt-8">
          <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              © {new Date().getFullYear()} Kanbi. All rights reserved.
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Built to save you 2 hours every day
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
