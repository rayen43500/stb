import { Router } from "express";
import { authRequired, loadUser, requireRoles } from "../middleware/auth.js";
import { ROLES } from "../models/User.js";
import {
  listPendingClients,
  approveClient,
  rejectClient,
  createStaffAccount,
  listAgents,
  monthlyReport,
  monthlyReportPdf,
} from "../controllers/chefController.js";

const r = Router();
const chefRoles = [ROLES.CHEF_AGENCE, ROLES.ADMIN];

r.use(authRequired, loadUser, requireRoles(...chefRoles));

r.get("/pending-clients", listPendingClients);
r.post("/clients/:id/approve", approveClient);
r.post("/clients/:id/reject", rejectClient);
r.post("/staff", createStaffAccount);
r.get("/agents", listAgents);
r.get("/reports/monthly", monthlyReport);
r.get("/reports/monthly.pdf", monthlyReportPdf);

export default r;
