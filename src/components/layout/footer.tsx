"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t bg-black mt-12">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-2 sm:gap-4">
          <div className="text-xs sm:text-sm text-white">
            © 2024 KANBI - Muhammad Tanveer Abbas
          </div>

          <div className="flex gap-4 sm:gap-6 text-xs sm:text-sm">
            <Link
              href="/privacy"
              className="text-white hover:text-gray-300 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-white hover:text-gray-300 transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
