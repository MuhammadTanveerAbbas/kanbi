import LayoutWrapper from "@/components/layout-wrapper";
import LenisProvider from "@/components/lenis-provider";
import { Providers } from "@/components/providers";
import { cn } from "@/lib/utils";
import { SITE_URL } from "@/app/sitemap";
import type { Metadata } from "next";
import { Sora, PT_Sans } from "next/font/google";
import {
  FONT_TOKENS,
  themeInitScript,
  themeStyleSheet,
} from "@/lib/design-tokens";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const ptSans = PT_Sans({
  subsets: ["latin"],
  variable: "--font-pt-sans",
  display: "swap",
  weight: ["400", "700"],
});

/**
 * One title and one description, reused everywhere. The previous values made
 * time and effort claims ("saves 2 hours daily", "in 10 seconds") that no
 * measurement in this repository supports, and pointed metadataBase at a
 * different domain than the sitemap and robots file.
 */
const SITE_TITLE = "Kanbi - Turn notes into a task board";
const SITE_DESCRIPTION =
  "Paste text, upload a PDF, or give a web page URL. Kanbi extracts the action items into a Kanban board, scores how loaded your week is, and exports to DOCX or PDF.";

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  keywords: [
    "AI task management",
    "kanban board",
    "productivity app",
    "AI workload management",
    "burnout prevention",
    "AI productivity coach",
    "task automation",
    "AI assistant",
    "project management",
    "free kanban",
    "AI productivity tool",
    "open source AI models",
  ],
  authors: [{ name: "Kanbi" }],
  creator: "Kanbi",
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
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Kanbi - a Kanban board filled with extracted tasks",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/twitter-image"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon", sizes: "48x48" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-64.png", type: "image/png", sizes: "64x64" },
    ],
    apple: [{ url: "/apple-icon-180.png", type: "image/png", sizes: "180x180" }],
    shortcut: "/favicon.ico",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  // One media query per theme. A fixed colour left the address bar in black on
  // the light theme, which is the same class of bug as a light page frame
  // around a dark app.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f3fb" },
    { media: "(prefers-color-scheme: dark)", color: "#07070b" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        {/*
          The palette for both themes, emitted once. Every page used to carry
          its own copy interpolated from React state, which is why the first
          paint could not know the answer and the theme flashed.
        */}
        <style
          id="design-tokens"
          dangerouslySetInnerHTML={{ __html: themeStyleSheet() }}
        />
        {/*
          Resolves the stored preference before the body is parsed. Without
          this the browser paints the default, then React corrects it a frame
          later, and that gap is the flash.

          The element id deliberately does not spell out the storage key. The
          fitness suite asserts that the key appears in exactly one file, which
          is what stops a second surface from reading the preference a
          different way, and an id that happened to contain the same string
          would trip that check while being entirely harmless.
        */}
        <script
          id="resolve-appearance-before-paint"
          data-purpose="resolve-theme-before-paint"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
      </head>
      <body
        className={cn("antialiased", sora.variable, ptSans.variable)}
        style={FONT_TOKENS as React.CSSProperties}
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
