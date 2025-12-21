import type { Metadata } from "next";
import { Space_Grotesk, Rubik_Glitch } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
  preload: true,
});

const rubikGlitch = Rubik_Glitch({
  subsets: ["latin"],
  variable: "--font-rubik-glitch",
  weight: "400",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "KANBI - Turn Notes Into Action",
  description:
    "Transform chaotic notes into organized Kanban boards instantly with AI. Free, no signup required, 100% private. Perfect for founders, teams & creators.",
  keywords:
    "AI task management, kanban board, productivity app, note to task converter, project management, free kanban, offline task manager, AI productivity tool",
  authors: [{ name: "Muhammad Tanveer Abbas" }],
  creator: "Muhammad Tanveer Abbas",
  publisher: "KANBI",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://kanbi-actionboard.vercel.app",
    title: "KANBI - AI Powered Task Management",
    description:
      "Transform chaotic notes into organized Kanban boards instantly with AI. Free, no signup required.",
    siteName: "KANBI",
  },
  twitter: {
    card: "summary_large_image",
    title: "KANBI - AI Powered Task Management",
    description:
      "Transform chaotic notes into organized Kanban boards instantly with AI.",
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
    <html lang="en" className="scroll-smooth">
      <body
        className={cn(
          "antialiased font-sans",
          spaceGrotesk.variable,
          rubikGlitch.variable
        )}
      >
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
