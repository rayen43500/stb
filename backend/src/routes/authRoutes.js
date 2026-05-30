import { Router } from "express";
import { register, login, me, activateAccount } from "../controllers/authController.js";
import { authRequired, loadUser } from "../middleware/auth.js";

const r = Router();

r.post("/register", register);
r.post("/activate", activateAccount);
r.post("/login", login);
r.get("/me", authRequired, loadUser, me);

export default r;
