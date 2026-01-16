"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Menu, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isLoggedIn = false;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobileMenuOpen]);

  const navLinks: never[] = [];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/80 backdrop-blur-md border-b border-border shadow-sm"
          : "bg-background/95 backdrop-blur-sm border-b border-border/50"
      }`}
    >
      <div className="px-4 sm:px-6">
        <div className={`flex items-center justify-between transition-all duration-300 ${
          isScrolled ? "h-14 sm:h-16" : "h-16 sm:h-20"
        }`}>
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center space-x-2 min-h-[44px] min-w-[44px]"
          >
            <LayoutGrid className={`text-primary transition-all duration-300 ${
              isScrolled ? "h-5 w-5 sm:h-6 sm:w-6" : "h-6 w-6 sm:h-7 sm:w-7"
            }`} />
            <span className={`font-bold font-headline transition-all duration-300 ${
              isScrolled ? "text-base sm:text-lg" : "text-lg sm:text-xl"
            }`}>
              KANBI
            </span>
          </Link>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center space-x-3 ml-auto">
            {isLoggedIn ? (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/dashboard" className="min-h-[44px]">
                    Dashboard
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]">
                  <User className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <>
                <Button asChild className="min-h-[44px]">
                  <Link href="/sign-up">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center text-foreground"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-background border-t border-border">
          <div className="container mx-auto px-4 py-6 space-y-4">
              <div className="space-y-3">
                {isLoggedIn ? (
                  <>
                    <Button variant="ghost" asChild className="w-full min-h-[44px] justify-start">
                      <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                        Dashboard
                      </Link>
                    </Button>
                    <Button variant="ghost" asChild className="w-full min-h-[44px] justify-start">
                      <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)}>
                        Profile
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild className="w-full min-h-[44px]">
                      <Link href="/sign-up" onClick={() => setIsMobileMenuOpen(false)}>
                        Get Started
                      </Link>
                    </Button>
                  </>
                )}
              </div>
          </div>
        </div>
      )}
    </nav>
  );
}
