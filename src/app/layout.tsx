import LayoutWrapper from "@/components/layout-wrapper";
import LenisProvider from "@/components/lenis-provider";
import { Providers } from "@/components/providers";
import { cn } from "@/lib/utils";
import { SITE_URL } from "@/app/sitemap";
import type { Metadata } from "next";
import Script from "next/script";
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
const SITE_TITLE = "Kanbi - Private task and note management";
const SITE_DESCRIPTION =
  "Kanbi turns notes, PDFs and URLs into a Kanban board, and keeps your todos, notes and images private. 50 AI requests a day, free.";

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
    "private task management",
    "personal notes",
    "todo lists",
    "private image storage",
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
        alt: "Kanbi - a Kanban board filled with extracted tasks. Try Kanbi free, no card needed.",
      },
    ],
  },
  twitter: {
    // The 1200x630 image is the point of the card. A summary card shrinks it to
    // a thumbnail next to the text, so use the large image layout instead.
    card: "summary_large_image",
    site: "@m_tanveerabbas",
    creator: "@m_tanveerabbas",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/twitter-image",
        alt: "Kanbi - turn notes into a Kanban board. Try Kanbi free, no card needed.",
      },
    ],
  },
  icons: {
    // Every size is resized from public/Kanbi.png, so the favicon is the real
    // logo. Its corners stay transparent instead of being filled white.
    icon: [
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon.ico", type: "image/x-icon", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "64x64" },
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
    shortcut: "/favicon.ico",
  },
};

/**
 * Structured data for crawlers. Kept as one object and stringified so the
 * values cannot drift away from the title, description and URL used above.
 * No ratings or review counts are included because none are measured.
 */
const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: SITE_TITLE,
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  image: `${SITE_URL}/opengraph-image`,
  inLanguage: "en",
  publisher: {
    "@type": "Organization",
    name: "KANBI",
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/Kanbi.png`,
    },
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
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
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
          Next.js has no openGraph.logo field, and the metadata API renders the
          `other` field with a name attribute. Emit the exact property tag here
          so crawlers checking for og:logo find it on every page.
        */}
        <meta property="og:logo" content={`${SITE_URL}/Kanbi.png`} />
        {/*
          Next.js has no JSON-LD field in the metadata API. Emit the exact
          script tag here so crawlers can read it on the server rendered page.
        */}
        <script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
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

          The body of the script is a string built in `design-tokens.ts` rather
          than markup written here, which keeps the storage key in exactly one
          file. A second surface spelling the key out itself is how two
          surfaces end up reading the preference two different ways.
        */}
        <Script
          id="resolve-appearance-before-paint"
          strategy="beforeInteractive"
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
