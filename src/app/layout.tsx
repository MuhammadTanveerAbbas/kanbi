import { ErrorBoundaryWrapper } from "@/components/error-boundary-wrapper";
import LayoutWrapper from "@/components/layout-wrapper";
import "@/lib/console-suppressor";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KANBI - AI Task Management That Saves 2 Hours Daily",
  description:
    "AI powered task management that turns messy notes into organized Kanban boards in 10 seconds. Features AI workload management, burnout prevention, productivity coaching, and Notion integration. Export to DOCX, PDF. $9/month.",
  keywords:
    "AI task management, kanban board, productivity app, AI workload management, burnout prevention, AI productivity coach, Notion integration, task automation, AI assistant, project management, free kanban, AI productivity tool, Groq AI",
  authors: [{ name: "Muhammad Tanveer Abbas" }],
  creator: "Muhammad Tanveer Abbas",
  publisher: "KANBI",
  robots: "index, follow",
  metadataBase: new URL('https://kanbi.vercel.app'),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://kanbi.vercel.app",
    title: "KANBI - AI Task Management That Saves 2 Hours Daily",
    description:
      "Turns hours of task planning into 10 seconds. Smart workload management prevents burnout. Notion integration for seamless sync. Only $9/month.",
    siteName: "KANBI",
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Kanbi - AI Task Management',
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "KANBI - AI Task Management That Saves 2 Hours Daily",
    description:
      "AI powered task management with burnout prevention, productivity coaching, and Notion integration. $9/month.",
    creator: "@yourtwitterhandle",
    images: ['/twitter-image'],
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon', type: 'image/png', sizes: '64x64' },
    ],
    apple: '/apple-icon',
    shortcut: '/favicon.svg',
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
    <html lang="en" className="scroll-smooth" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body
        className={cn("antialiased font-sans", spaceGrotesk.variable)}
        suppressHydrationWarning
      >
        <ErrorBoundaryWrapper>
          <LayoutWrapper>{children}</LayoutWrapper>
        </ErrorBoundaryWrapper>
      </body>
    </html>
  );
}
