"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Icons } from "@/components/dashboard/icons";
import { useApp } from "@/components/dashboard/types";
import { IMAGE_MAX_BYTES, NOTE_CONTENT_MAX, NOTE_TITLE_MAX } from "@/lib/constants";

type NoteRow = {
  id: string;
  title: string;
  content: string;
  folder: string | null;
  is_favorite: boolean;
  updated_at: string;
};

type ImageRow = {
  id: string;
  file_name: string;
  size_bytes: number;
  url: string | null;
};

const IMAGE_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function toNote(row: Record<string, unknown>): NoteRow {
  return {
    id: asString(row.id),
    title: asString(row.title),
    content: asString(row.content),
    folder: typeof row.folder === "string" ? row.folder : null,
    is_favorite: row.is_favorite === true,
    updated_at: asString(row.updated_at),
  };
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

async function failureMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body = await response.json();
    const error: unknown = body?.error;
    if (typeof error === "string") return error;
    if (error && typeof error === "object" && "message" in error) return asString(error.message) || fallback;
    return fallback;
  } catch {
    return fallback;
  }
}

/**
 * Personal notes. Notes and their images belong to this page, not to the
 * dashboard board, so nothing here can change a task. Images live in the
 * private bucket and are shown through short lived signed URLs.
 */
export function NotePage() {
  const { user } = useApp();

  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [activeId, setActiveId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [titleError, setTitleError] = useState("");
  const [images, setImages] = useState<ImageRow[]>([]);
  const [imageError, setImageError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [deleteArmed, setDeleteArmed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const summaryRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const notesRef = useRef<NoteRow[]>([]);

  const active = notes.find((note) => note.id === activeId) ?? null;

  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  useEffect(() => {
    fetch("/api/notes")
      .then(async (response) => {
        if (!response.ok) throw new Error(await failureMessage(response, "Could not load your notes."));
        const body = await response.json();
        const loaded: NoteRow[] = (body.data ?? []).map((row: Record<string, unknown>) => toNote(row));
        setNotes(loaded);
        setActiveId((current) => (current && loaded.some((note) => note.id === current) ? current : loaded[0]?.id ?? ""));
      })
      .catch((caught: unknown) => {
        toast.error(caught instanceof Error ? caught.message : "Could not load your notes.");
      })
      .finally(() => setLoading(false));
  }, [reloadKey]);

  useEffect(() => {
    const note = notesRef.current.find((item) => item.id === activeId);
    setTitle(note?.title ?? "");
    setContent(note?.content ?? "");
    setTitleError("");
    setDeleteArmed(false);
    setImageError("");
    if (!note) {
      setImages([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/notes/images?noteId=${encodeURIComponent(note.id)}`)
      .then(async (response) => {
        if (cancelled || !response.ok) return;
        const body = await response.json();
        if (cancelled) return;
        setImages((body.data ?? []).map((row: Record<string, unknown>) => ({
          id: asString(row.id),
          file_name: asString(row.file_name),
          size_bytes: typeof row.size_bytes === "number" ? row.size_bytes : 0,
          url: typeof row.url === "string" ? row.url : null,
        })));
      })
      .catch(() => { if (!cancelled) setImages([]); });
    return () => { cancelled = true; };
  }, [activeId]);

  const createNote = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled note", content: "" }),
      });
      if (!response.ok) throw new Error(await failureMessage(response, "Could not create the note."));
      const body = await response.json();
      const created = toNote(body.data ?? {});
      setNotes((current) => [created, ...current]);
      setActiveId(created.id);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not create the note.");
    } finally {
      setBusy(false);
    }
  };

  const saveNote = async () => {
    if (!active || busy) return;
    if (title.trim().length === 0) {
      setTitleError("Add a title before saving.");
      summaryRef.current?.focus();
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/notes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: active.id, title: title.trim(), content }),
      });
      if (!response.ok) throw new Error(await failureMessage(response, "Could not save the note."));
      const body = await response.json();
      const saved = toNote(body.data ?? {});
      setNotes((current) => current.map((note) => (note.id === saved.id ? saved : note)));
      toast.success("Note saved");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not save the note.");
    } finally {
      setBusy(false);
    }
  };

  const deleteNote = async () => {
    if (!active || busy) return;
    if (!deleteArmed) {
      setDeleteArmed(true);
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`/api/notes?id=${encodeURIComponent(active.id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await failureMessage(response, "Could not delete the note."));
      setNotes((current) => current.filter((note) => note.id !== active.id));
      setDeleteArmed(false);
      toast.success("Note deleted");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not delete the note.");
    } finally {
      setBusy(false);
    }
  };

  const uploadImage = async (file: File) => {
    if (!active || uploading) return;
    setImageError("");
    if (!IMAGE_MIME.includes(file.type)) {
      setImageError("Only JPEG, PNG, WebP and GIF images are accepted.");
      return;
    }
    if (file.size > IMAGE_MAX_BYTES) {
      setImageError(`That file is ${formatSize(file.size)}. Images must be 5 MB or smaller.`);
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("noteId", active.id);
      form.append("file", file);
      const response = await fetch("/api/notes/images", { method: "POST", body: form });
      if (!response.ok) {
        const message = await failureMessage(response, "Could not upload the image.");
        setImageError(message);
        throw new Error(message);
      }
      const body = await response.json();
      const row = body.data ?? {};
      setImages((current) => [...current, {
        id: asString(row.id),
        file_name: asString(row.file_name),
        size_bytes: typeof row.size_bytes === "number" ? row.size_bytes : file.size,
        url: typeof row.url === "string" ? row.url : null,
      }]);
    } catch (caught) {
      if (!imageError) toast.error(caught instanceof Error ? caught.message : "Could not upload the image.");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (image: ImageRow) => {
    try {
      const response = await fetch(`/api/notes/images?id=${encodeURIComponent(image.id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await failureMessage(response, "Could not remove the image."));
      setImages((current) => current.filter((item) => item.id !== image.id));
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not remove the image.");
    }
  };

  const importDocx = async (file: File) => {
    if (importing) return;
    setImporting(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/notes/import", { method: "POST", body: form });
      if (!response.ok) throw new Error(await failureMessage(response, "Could not import the document."));
      const body = await response.json();
      const created = toNote(body.data ?? {});
      setNotes((current) => [created, ...current]);
      setActiveId(created.id);
      toast.success("Document imported");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not import the document.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fade-up page-pad">
      <style>{`
        .note-focus:focus-visible { outline:2px solid var(--ac); outline-offset:2px }
        .note-grid { display:grid; grid-template-columns:280px minmax(0,1fr); gap:16px; align-items:start }
        @media (max-width:900px) { .note-grid { grid-template-columns:minmax(0,1fr) } }
        .note-item { width:100%; text-align:left; padding:10px 12px; border:1px solid var(--br);
          border-radius:var(--radius-sm); background:var(--bg2); cursor:pointer;
          display:flex; flex-direction:column; gap:4px }
        .note-item:hover { border-color:var(--brh) }
        .note-item[aria-current="true"] { border-color:var(--ag); background:var(--as) }
        .note-item-title { font-size:13px; font-weight:500; color:var(--tx); overflow:hidden;
          text-overflow:ellipsis; white-space:nowrap; letter-spacing:-0.01em }
        .note-item-meta { font-size:11px; color:var(--tx3); font-family:var(--font-mono) }
        .note-input { width:100%; color:var(--tx); background:var(--inp); border:1px solid var(--br);
          border-radius:var(--radius-sm); font-family:var(--font-body); font-size:13px; padding:0 12px; height:40px }
        .note-area { width:100%; min-height:320px; resize:vertical; color:var(--tx); background:var(--inp);
          border:1px solid var(--br); border-radius:var(--radius-sm); font-family:var(--font-body);
          font-size:13px; line-height:1.7; padding:12px }
        .note-input[aria-invalid="true"], .note-area[aria-invalid="true"] { border-color:var(--rd) }
        .note-image { position:relative; width:112px; height:112px; border-radius:var(--radius-sm);
          border:1px solid var(--br); overflow:hidden; background:var(--bg3) }
        .note-image img { width:100%; height:100%; object-fit:cover; display:block }
        .note-image-remove { position:absolute; top:4px; right:4px }
      `}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.035em", color: "var(--tx)",
            fontFamily: "var(--font-display)" }}>Notes</h2>
          <p className="page-sub">
            {user?.full_name ? `${user.full_name.split(" ")[0]}'s private notes` : "Your private notes"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="btn btn-ghost btn-sm note-focus" disabled={importing}
            onClick={() => importInputRef.current?.click()}>
            <span aria-hidden="true" style={{ display: "inline-flex" }}><Icons.Upload size={16} /></span>
            {importing ? "Importing" : "Import DOCX"}
          </button>
          <button type="button" className="btn btn-primary btn-sm note-focus" disabled={busy}
            onClick={() => void createNote()}>
            <span aria-hidden="true" style={{ display: "inline-flex" }}><Icons.Plus size={16} /></span> New note
          </button>
        </div>
      </div>

      <input
        ref={importInputRef} type="file" accept=".docx" className="sr-only" aria-hidden="true" tabIndex={-1}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void importDocx(file);
        }}
      />

      <div
        ref={summaryRef}
        role="alert"
        tabIndex={-1}
        aria-live="polite"
        style={titleError ? {
          border: "1px solid var(--rd)", borderRadius: "var(--radius-sm)",
          color: "var(--rd-text)", padding: "10px 12px", fontSize: 12,
        } : { position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}
      >
        {titleError || ""}
      </div>

      <div className="note-grid">
        <section className="panel" aria-label="Your notes">
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[0, 1, 2].map((index) => (
                <div key={index} style={{ height: 52, borderRadius: "var(--radius-sm)", background: "var(--bg2)" }} />
              ))}
            </div>
          ) : notes.length === 0 ? (
            <div className="empty-state empty-state-sm">
              <span className="empty-state-icon" aria-hidden="true"><Icons.Edit size={16} /></span>
              <p className="empty-state-title">No notes yet</p>
              <p className="empty-state-body">Write one, or import a DOCX document.</p>
            </div>
          ) : (
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
              {notes.map((note) => (
                <li key={note.id}>
                  <button type="button" className="note-item note-focus"
                    aria-current={note.id === activeId ? "true" : undefined}
                    onClick={() => setActiveId(note.id)}>
                    <span className="note-item-title">
                      {note.is_favorite ? "★ " : ""}{note.title || "Untitled note"}
                    </span>
                    <span className="note-item-meta">
                      {note.folder ? `${note.folder} · ` : ""}{formatDate(note.updated_at)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel" aria-label="Note editor">
          {!active ? (
            <div className="empty-state empty-state-sm">
              <span className="empty-state-icon" aria-hidden="true"><Icons.Edit size={16} /></span>
              <p className="empty-state-title">Nothing selected</p>
              <p className="empty-state-body">Create a note to start writing.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label htmlFor="note-title" style={{ display: "block", fontSize: 11, color: "var(--tx3)",
                  marginBottom: 6, fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>TITLE</label>
                <input
                  id="note-title"
                  className="note-input note-focus"
                  value={title}
                  maxLength={NOTE_TITLE_MAX}
                  aria-invalid={titleError ? "true" : undefined}
                  aria-describedby={titleError ? "note-title-error" : undefined}
                  onChange={(event) => { setTitle(event.target.value); if (titleError) setTitleError(""); }}
                  onBlur={() => { if (title.trim().length === 0) setTitleError("Add a title before saving."); }}
                />
                {titleError && (
                  <p id="note-title-error" style={{ marginTop: 6, fontSize: 11, color: "var(--rd-text)" }}>
                    {titleError}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="note-content" style={{ display: "block", fontSize: 11, color: "var(--tx3)",
                  marginBottom: 6, fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>NOTE</label>
                <textarea
                  id="note-content"
                  className="note-area note-focus"
                  value={content}
                  maxLength={NOTE_CONTENT_MAX}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="Write freely. Plain text keeps it readable and portable."
                />
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <button type="button" className="btn btn-primary btn-sm note-focus" disabled={busy}
                  onClick={() => void saveNote()}>Save</button>
                <button type="button" className="btn btn-ghost btn-sm note-focus" disabled={busy || uploading}
                  onClick={() => imageInputRef.current?.click()}>
                  <span aria-hidden="true" style={{ display: "inline-flex" }}><Icons.Upload size={16} /></span>
                  {uploading ? "Uploading" : "Add image"}
                </button>
                <span style={{ fontSize: 11, color: "var(--tx3)", fontFamily: "var(--font-mono)" }}>
                  {content.length.toLocaleString()} / {NOTE_CONTENT_MAX.toLocaleString()}
                </span>
                <button type="button" className="btn btn-ghost btn-sm note-focus"
                  style={{ marginLeft: "auto", color: deleteArmed ? "var(--rd-text)" : "var(--tx3)" }}
                  disabled={busy}
                  onClick={() => void deleteNote()}
                  onBlur={() => setDeleteArmed(false)}>
                  <span aria-hidden="true" style={{ display: "inline-flex" }}><Icons.Trash size={16} /></span>
                  {deleteArmed ? "Confirm delete" : "Delete"}
                </button>
              </div>

              <input
                ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only" aria-hidden="true" tabIndex={-1}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file) void uploadImage(file);
                }}
              />

              {imageError && (
                <p role="alert" style={{ fontSize: 11, color: "var(--rd-text)" }}>{imageError}</p>
              )}

              {images.length > 0 && (
                <div>
                  <p style={{ fontSize: 11, color: "var(--tx3)", marginBottom: 8,
                    fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
                    IMAGES ({images.length})
                  </p>
                  <ul style={{ listStyle: "none", display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {images.map((image) => (
                      <li key={image.id} className="note-image">
                        {image.url
                          ? <img src={image.url} alt={image.file_name} />
                          : <span style={{ display: "block", padding: 8, fontSize: 11, color: "var(--tx3)" }}>
                              {image.file_name}
                            </span>}
                        <button type="button" className="btn btn-ghost btn-icon btn-sm note-focus note-image-remove"
                          aria-label={`Remove ${image.file_name}`}
                          onClick={() => void removeImage(image)}>
                          <span aria-hidden="true" style={{ display: "inline-flex" }}><Icons.X size={14} /></span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <p style={{ marginTop: 6, fontSize: 11, color: "var(--tx3)" }}>
                    Images stay private. The assistant only reads one when you ask it to.
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
