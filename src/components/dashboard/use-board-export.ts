"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

/**
 * Downloads a saved board as DOCX or PDF.
 *
 * Shared by the Saved Boards page and the Settings export panel so both use one
 * request shape, one loading treatment, and one error message. The server sets
 * Content-Disposition, so the filename comes from the response rather than being
 * guessed on the client.
 */
/** Reads the filename from Content-Disposition, with UTF-8 names first. */
function downloadName(header: string | null, fallback: string): string {
  if (!header) return fallback;
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (encoded?.[1]) {
    try { return decodeURIComponent(encoded[1].replace(/"/g, "")); } catch { /* fall through */ }
  }
  const plain = /filename="?([^";]+)"?/i.exec(header);
  return plain?.[1]?.trim() || fallback;
}

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
      const filename = downloadName(res.headers.get("content-disposition"), `kanbi-board.${format}`);
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Revoke after the browser has started the download. An immediate revoke
      // cancels it in some browsers.
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      toast.success(`Exported ${filename}`);
    } catch {
      setError("Network error while exporting. Check your connection.");
    } finally {
      setExportingId(null);
    }
  }, []);

  return { exportBoard, exportingId, error, setError };
}
