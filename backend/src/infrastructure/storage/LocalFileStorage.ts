/**
 * Local-disk implementation of IFileStorage (infrastructure layer).
 *
 * Files are written by multer into UPLOAD_DIR and served statically at
 * /uploads. This class owns the path conventions and safe deletion.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { IFileStorage } from '../../domain/services/IFileStorage';

/** Absolute path to the uploads directory (project-root/uploads). */
export const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');

/** Public URL prefix under which uploads are served. */
export const UPLOAD_ROUTE = '/uploads';

export class LocalFileStorage implements IFileStorage {
  constructor() {
    // Ensure the directory exists at startup.
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  publicPath(fileName: string): string {
    return `${UPLOAD_ROUTE}/${fileName}`;
  }

  async remove(publicPath: string): Promise<void> {
    // Only handle paths we own; ignore anything else (e.g. external URLs).
    if (!publicPath.startsWith(`${UPLOAD_ROUTE}/`)) return;

    // Resolve to an absolute path and confirm it stays inside UPLOAD_DIR
    // (defends against path traversal like "/uploads/../../etc/passwd").
    const fileName = path.basename(publicPath);
    const absolute = path.resolve(UPLOAD_DIR, fileName);
    if (!absolute.startsWith(UPLOAD_DIR)) return;

    await fs.promises.rm(absolute, { force: true }).catch(() => {
      /* best-effort: ignore if already gone */
    });
  }
}
