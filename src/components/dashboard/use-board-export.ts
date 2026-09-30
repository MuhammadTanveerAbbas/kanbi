"use client";

import { useCallback, useState } from "react";

/**
 * Downloads a saved board as DOCX or PDF.
 *
 * Shared by the Saved Boards page and the Settings export panel so both use one
 * request shape, one loading treatment, and one error message. The server sets
 * Content-Disposition, so the filename comes from the response rather than being
 * guessed on the client.
 */
export function useBoardExport() {
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const exportBoard = useCallback(async (boardId: string, format: "docx" | "pdf") => {
    setExportingId(boardId);
    setError(null);
    try {
      const res = await fetch(`/api/boards/${boardId}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Export failed. Please try again.");
        return;
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = "";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      setError("Network error while exporting. Check your connection.");
    } finally {
      setExportingId(null);
    }
  }, []);

  return { exportBoard, exportingId, error, setError };
}
