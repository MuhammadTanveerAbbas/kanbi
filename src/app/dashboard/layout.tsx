'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LayoutDashboard, Bookmark, Compass, LogOut, User, Settings, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import KeyboardShortcuts from '@/components/dashboard/keyboard-shortcuts';
import OnboardingTour from '@/components/dashboard/onboarding-tour';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/board', label: 'Board', icon: Compass },
  { href: '/dashboard/saved', label: 'Saved', icon: Bookmark },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <>
      <OnboardingTour />
      <div className="hidden sm:block">
        <KeyboardShortcuts />
      </div>
      
      <div className="min-h-screen bg-[#141414] text-white flex flex-col">
      {/* Pill Navbar */}
      <nav className="sticky top-0 z-40 border-b border-[#262626] bg-[#141414]/95 backdrop-blur-sm py-4">
        <div className="px-4 sm:px-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <LayoutGrid className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">KANBI</span>
          </Link>

          {/* Nav Items - Desktop */}
          <div className="hidden md:flex gap-2 bg-[#1a1a1a] p-1 rounded-full border border-[#262626] absolute left-1/2 -translate-x-1/2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                      isActive ? 'text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r from-[#1f1f1f] to-[#2a2a2a] rounded-full"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <Icon className="h-4 w-4 relative z-10" />
                    <span className="relative z-10">{item.label}</span>
                  </motion.button>
                </Link>
              );
            })}
          </div>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#1f1f1f] to-[#2a2a2a] flex items-center justify-center border border-[#262626]">
                  <User className="h-4 w-4" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-500">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[#262626] bg-[#141414]/95 backdrop-blur-sm">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className="flex-1">
                <button
                  className={`w-full h-full flex flex-col items-center justify-center gap-1 transition-colors ${
                    isActive ? 'text-white' : 'text-gray-400'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs">{item.label}</span>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#2a2a2a] to-[#3a3a3a]" />
                  )}
                </button>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Page Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
        {children}
      </main>
    </div>
    </>
  );
}
