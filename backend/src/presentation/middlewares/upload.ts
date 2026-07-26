/**
 * Multer upload middleware (presentation layer).
 *
 * Accepts a single image file under the field name "image", stores it on disk
 * with a random name, and enforces:
 *   - images only (jpeg/png/webp/gif)
 *   - max 2 MB
 * Rejections surface as errors handled by the central error handler.
 */
import crypto from 'node:crypto';
import path from 'node:path';
import multer from 'multer';
import { UPLOAD_DIR } from '../../infrastructure/storage/LocalFileStorage';

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    // Random, collision-free name; keep the original extension.
    const ext = path.extname(file.originalname).toLowerCase().slice(0, 10);
    const name = `${crypto.randomBytes(16).toString('hex')}${ext}`;
    cb(null, name);
  },
});

export const uploadImage = multer({
  storage,
  limits: { fileSize: MAX_SIZE, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, png, webp, gif) are allowed'));
    }
  },
}).single('image');
