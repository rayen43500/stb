import { Router } from "express";
import { uploadSingle } from "../middleware/upload.js";
import { uploadForCredit, listForCredit, downloadDocument, removeDocument } from "../controllers/documentController.js";
import { authRequired, loadUser } from "../middleware/auth.js";

const r = Router();

r.use(authRequired, loadUser);

r.post("/credit/:creditId", uploadSingle.single("file"), uploadForCredit);
r.get("/credit/:creditId", listForCredit);
r.get("/:id/download", downloadDocument);
r.delete("/:id", removeDocument);

export default r;
