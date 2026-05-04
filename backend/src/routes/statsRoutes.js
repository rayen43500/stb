import { Router } from "express";
import { dashboardStats, statsRoles } from "../controllers/statsController.js";
import { authRequired, loadUser, requireRoles } from "../middleware/auth.js";

const r = Router();

r.use(authRequired, loadUser);
r.get("/dashboard", requireRoles(...statsRoles), dashboardStats);

export default r;
