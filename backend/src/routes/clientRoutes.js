import { Router } from "express";
import { authRequired, loadUser } from "../middleware/auth.js";
import { updateMyProfile } from "../controllers/clientController.js";

const r = Router();

r.patch("/me", authRequired, loadUser, updateMyProfile);

export default r;
