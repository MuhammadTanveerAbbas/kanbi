import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import LayoutWrapper from "@/components/layout-wrapper";
import { ErrorBoundaryWrapper } from "@/components/error-boundary-wrapper";
import "@/lib/console-suppressor";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "KANBI - AI Task Management That Saves 2 Hours Daily",
  description:
    "AI-powered task management that turns messy notes into organized Kanban boards in 10 seconds. Features AI workload management, burnout prevention, productivity coaching, and Notion integration. Export to DOCX, PDF. $9/month.",
  keywords:
    "AI task management, kanban board, productivity app, AI workload management, burnout prevention, AI productivity coach, Notion integration, task automation, AI assistant, project management, free kanban, AI productivity tool, Groq AI",
  authors: [{ name: "Muhammad Tanveer Abbas" }],
  creator: "Muhammad Tanveer Abbas",
  publisher: "KANBI",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://kanbi.vercel.app",
    title: "KANBI - AI Task Management That Saves 2 Hours Daily",
    description:
      "AI turns 2 hours of task planning into 10 seconds. Smart workload management prevents burnout. Notion integration for seamless sync. Only $9/month.",
    siteName: "KANBI",
  },
  twitter: {
    card: "summary_large_image",
    title: "KANBI - AI Task Management That Saves 2 Hours Daily",
    description:
      "AI-powered task management with burnout prevention, productivity coaching, and Notion integration. $9/month.",
    creator: "@yourtwitterhandle",
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
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        {process.env.NODE_ENV === 'development' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if (typeof window !== 'undefined') {
                  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = window.__REACT_DEVTOOLS_GLOBAL_HOOK__ || {};
                  window.__REACT_DEVTOOLS_GLOBAL_HOOK__.inject = function() {};
                }
              `,
            }}
          />
        )}
      </head>
      <body
        className={cn(
          "antialiased font-sans",
          spaceGrotesk.variable
        )}
        suppressHydrationWarning
      >
        <ErrorBoundaryWrapper>
          <LayoutWrapper>{children}</LayoutWrapper>
        </ErrorBoundaryWrapper>
      </body>
    </html>
  );
}
