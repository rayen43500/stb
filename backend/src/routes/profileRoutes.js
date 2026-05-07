import { Router } from "express";
import multer from "multer";
import { uploadAvatarMulter } from "../middleware/upload.js";
import { authRequired, loadUser } from "../middleware/auth.js";
import {
  updateProfile,
  changePassword,
  uploadMyAvatar,
  getMyAvatar,
  deleteMyAvatar,
} from "../controllers/profileController.js";

const r = Router();

r.use(authRequired, loadUser);

r.patch("/", updateProfile);
r.patch("/password", changePassword);
r.get("/avatar", getMyAvatar);
r.delete("/avatar", deleteMyAvatar);

function uploadAvatarMiddleware(req, res, next) {
  uploadAvatarMulter.single("file")(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        const msg =
          err.code === "LIMIT_FILE_SIZE" ? "Image trop volumineuse (max 2 Mo)" : err.message;
        return res.status(400).json({ message: msg });
      }
      return res.status(400).json({ message: err.message || "Envoi du fichier refusé" });
    }
    next();
  });
}

r.post("/avatar", uploadAvatarMiddleware, uploadMyAvatar);

export default r;
