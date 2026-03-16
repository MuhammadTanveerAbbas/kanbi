"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, UserPlus, LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

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

          {/* Actions */}
          <div className="flex items-center space-x-3 ml-auto">
            {user ? (
              <>
                <Button asChild variant="outline" size="sm" className="h-9 sm:min-h-[44px] text-xs sm:text-sm px-2 sm:px-4">
                  <Link href="/dashboard" className="flex items-center gap-1.5 sm:gap-2">
                    <LayoutDashboard className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Dashboard
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 rounded-full focus-visible:ring-0 focus-visible:ring-offset-0">
                      <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gradient-to-br from-[#1f1f1f] to-[#2a2a2a] flex items-center justify-center border border-[#262626]">
                        <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-500">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button asChild className="h-9 sm:min-h-[44px] text-[9px] sm:text-sm px-1.5 sm:px-4">
                <Link href="/sign-up" className="flex items-center gap-0.5 sm:gap-2">
                  <UserPlus className="h-2.5 w-2.5 sm:h-4 sm:w-4" />
                  Get Started
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
