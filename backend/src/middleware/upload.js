import fs from "fs";
import path from "path";
import multer from "multer";
import { randomUUID } from "crypto";

const UPLOAD_ROOT = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

export function ensureUploadDirs() {
  const creditsDir = path.join(UPLOAD_ROOT, "credits");
  const avatarsDir = path.join(UPLOAD_ROOT, "avatars");
  fs.mkdirSync(creditsDir, { recursive: true });
  fs.mkdirSync(avatarsDir, { recursive: true });
  return { UPLOAD_ROOT, creditsDir, avatarsDir };
}

export const { creditsDir, avatarsDir } = ensureUploadDirs();

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

const avatarStorage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, avatarsDir);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname) || "";
    cb(null, `avatar-${Date.now()}-${randomUUID()}${ext}`);
  },
});

export const uploadAvatarMulter = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const ok = /^image\/(jpeg|png|gif|webp)$/i.test(file.mimetype);
    if (!ok) return cb(new Error("Image requise : JPEG, PNG, GIF ou WebP"));
    cb(null, true);
  },
});
