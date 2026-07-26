/**
 * Contract for file storage (domain layer).
 *
 * Abstracts WHERE uploaded files live (local disk, S3, Cloudinary, ...).
 * Use cases depend on this interface, not on the concrete storage.
 */
export interface IFileStorage {
  /**
   * Return the public URL/path for a stored file name.
   * e.g. "abc123.jpg" -> "/uploads/abc123.jpg"
   */
  publicPath(fileName: string): string;

  /**
   * Delete a stored file by its public path (best-effort; must not throw if
   * the file is already gone). Used when a cover image is replaced or removed.
   */
  remove(publicPath: string): Promise<void>;
}
