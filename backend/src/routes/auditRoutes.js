import { Router } from "express";
import { listAuditLogs } from "../controllers/auditController.js";
import { authRequired, loadUser, requireRoles } from "../middleware/auth.js";
import { ROLES } from "../models/User.js";

const r = Router();

r.use(authRequired, loadUser, requireRoles(ROLES.CHEF_AGENCE));

r.get("/", listAuditLogs);

export default r;
