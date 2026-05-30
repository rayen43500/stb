import { Router } from "express";
import { dashboardStats, workspaceStats, clientDashboard, statsRoles } from "../controllers/statsController.js";
import { authRequired, loadUser, requireRoles } from "../middleware/auth.js";
import { ROLES } from "../models/User.js";

const r = Router();

r.use(authRequired, loadUser);
r.get("/dashboard", requireRoles(...statsRoles), dashboardStats);
r.get("/workspace", requireRoles(...statsRoles), workspaceStats);
r.get("/client", requireRoles(ROLES.CLIENT), clientDashboard);

export default r;
