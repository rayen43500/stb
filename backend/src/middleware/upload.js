import fs from "fs";
import path from "path";
import multer from "multer";
import { randomUUID } from "crypto";

const UPLOAD_ROOT = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

export function ensureUploadDirs() {
  const creditsDir = path.join(UPLOAD_ROOT, "credits");
  fs.mkdirSync(creditsDir, { recursive: true });
  return { UPLOAD_ROOT, creditsDir };
}

export const { creditsDir } = ensureUploadDirs();

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, creditsDir);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname) || "";
    cb(null, `${Date.now()}-${randomUUID()}${ext}`);
  },
});

export const uploadSingle = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});
