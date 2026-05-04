import { Router } from "express";
import { listUsers, updateUserRole } from "../controllers/userController.js";
import { authRequired, loadUser, requireRoles } from "../middleware/auth.js";
import { ROLES } from "../models/User.js";

const r = Router();

r.use(authRequired, loadUser, requireRoles(ROLES.ADMIN));

r.get("/", listUsers);
r.patch("/:id", updateUserRole);

export default r;
