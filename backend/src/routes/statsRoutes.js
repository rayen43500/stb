import { Router } from "express";
import { workspaceStats, clientDashboard } from "../controllers/statsController.js";
import { authRequired, loadUser, requireRoles } from "../middleware/auth.js";
import { ROLES } from "../models/User.js";

const r = Router();

r.use(authRequired, loadUser);

r.get("/client", requireRoles(ROLES.CLIENT), clientDashboard);

r.get(
  "/workspace",
  requireRoles(ROLES.AGENT_BANCAIRE, ROLES.CHEF_AGENCE, ROLES.ADMIN),
  workspaceStats
);

export default r;
