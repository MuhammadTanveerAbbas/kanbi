import LayoutWrapper from "@/components/layout-wrapper";
import LenisProvider from "@/components/lenis-provider";
import { Providers } from "@/components/providers";
import { cn } from "@/lib/utils";
import { SITE_URL } from "@/app/sitemap";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Sora } from "next/font/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

/**
 * One title and one description, reused everywhere. The previous values made
 * time and effort claims ("saves 2 hours daily", "in 10 seconds") that no
 * measurement in this repository supports, and pointed metadataBase at a
 * different domain than the sitemap and robots file.
 */
const SITE_TITLE = 'Kanbi - Turn notes into a task board';
const SITE_DESCRIPTION =
  'Paste text, upload a PDF, or give a web page URL. Kanbi extracts the action items into a Kanban board, scores how loaded your week is, and exports to DOCX or PDF.';

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  keywords:
    "AI task management, kanban board, productivity app, AI workload management, burnout prevention, AI productivity coach, task automation, AI assistant, project management, free kanban, AI productivity tool, Groq AI",
  authors: [{ name: "Muhammad Tanveer Abbas" }],
  creator: "Muhammad Tanveer Abbas",
  publisher: "KANBI",
  robots: "index, follow",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: "KANBI",
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Kanbi - a Kanban board filled with extracted tasks',
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ['/twitter-image'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon', sizes: '48x48' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon-64.png', type: 'image/png', sizes: '64x64' },
    ],
    apple: [
      { url: '/apple-icon-180.png', type: 'image/png', sizes: '180x180' },
    ],
    shortcut: '/favicon.ico',
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn("antialiased font-sans", geist.variable, geistMono.variable, sora.variable)}
        suppressHydrationWarning
      >
        <Providers>
          <LenisProvider>
            <LayoutWrapper>{children}</LayoutWrapper>
          </LenisProvider>
        </Providers>
      </body>
    </html>
  );
}
