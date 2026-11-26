import { ALLOWED_IMAGE_MIME, IMAGE_MAX_BYTES } from '@/lib/constants';

export type ImageValidation =
  | { ok: true }
  | { ok: false; code: 'IMAGE_TOO_LARGE' | 'INVALID_IMAGE_TYPE' };

/**
 * A file is acceptable only when its declared type is one we render and its
 * size is at or under 5 MiB. The database repeats both rules as CHECK
 * constraints, so a route bug cannot store a file the UI cannot show.
 */
export function validateImage(file: File): ImageValidation {
  if (!ALLOWED_IMAGE_MIME.includes(file.type)) {
    return { ok: false, code: 'INVALID_IMAGE_TYPE' };
  }
  if (file.size > IMAGE_MAX_BYTES) {
    return { ok: false, code: 'IMAGE_TOO_LARGE' };
  }
  return { ok: true };
}

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

/** Storage path extension for an allowed type. Only called after validateImage. */
export function imageExtension(mimeType: string): string {
  return EXTENSIONS[mimeType] ?? 'bin';
}
