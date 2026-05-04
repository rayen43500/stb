import { Router } from "express";
import { listMine, markRead } from "../controllers/notificationController.js";
import { authRequired, loadUser } from "../middleware/auth.js";

const r = Router();

r.use(authRequired, loadUser);

r.get("/", listMine);
r.patch("/:id/read", markRead);

export default r;
