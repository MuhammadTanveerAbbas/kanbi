import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Board - KANBI | AI Task Management",
  description:
    "Manage your tasks with AI powered Kanban board. Drag and drop, organize, and track your progress.",
  robots: "noindex, nofollow",
};

export default function BoardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
