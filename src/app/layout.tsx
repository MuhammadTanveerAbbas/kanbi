import LayoutWrapper from "@/components/layout-wrapper";
import { Providers } from "@/components/providers";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "KANBI - AI Task Management That Saves 2 Hours Daily",
  description:
    "AI powered task management that turns messy notes into organized Kanban boards in 10 seconds. Features AI workload management, burnout prevention, and productivity coaching. Export to DOCX, PDF. $9/month.",
  keywords:
    "AI task management, kanban board, productivity app, AI workload management, burnout prevention, AI productivity coach, task automation, AI assistant, project management, free kanban, AI productivity tool, Groq AI",
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
      "Turns hours of task planning into 10 seconds. Smart workload management prevents burnout. Only $9/month.",
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
      "AI powered task management with burnout prevention and productivity coaching. $9/month.",
    creator: "@yourtwitterhandle",
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
    <html lang="en" className="scroll-smooth" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body
        className={cn("antialiased font-sans", plusJakarta.variable)}
        suppressHydrationWarning
      >
        <Providers>
          <LayoutWrapper>{children}</LayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}
