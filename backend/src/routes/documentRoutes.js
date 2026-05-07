import { Router } from "express";
import multer from "multer";
import { uploadSingle } from "../middleware/upload.js";
import { uploadForCredit, listForCredit, downloadDocument, removeDocument } from "../controllers/documentController.js";
import { authRequired, loadUser } from "../middleware/auth.js";

const r = Router();

r.use(authRequired, loadUser);

function uploadCreditFile(req, res, next) {
  uploadSingle.single("file")(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        const msg =
          err.code === "LIMIT_FILE_SIZE" ? "Fichier trop volumineux (max 10 Mo)" : err.message;
        return res.status(400).json({ message: msg });
      }
      return next(err);
    }
    next();
  });
}

r.post("/credit/:creditId", uploadCreditFile, uploadForCredit);
r.get("/credit/:creditId", listForCredit);
r.get("/:id/download", downloadDocument);
r.delete("/:id", removeDocument);

export default r;
