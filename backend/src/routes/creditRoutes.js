import { Router } from "express";
import {
  simulate,
  createDraft,
  listMine,
  getOne,
  transition,
  allowedNext,
  amortissementPdf,
  updateCreditMeta,
} from "../controllers/creditController.js";
import { authRequired, loadUser, requireRoles } from "../middleware/auth.js";
import { ROLES } from "../models/User.js";

const r = Router();

r.post("/simulate", simulate);

r.use(authRequired, loadUser);

r.get("/:id/allowed-next", allowedNext);
r.get("/:id/amortissement.pdf", amortissementPdf);

r.post("/", requireRoles(ROLES.CLIENT), createDraft);
r.get("/", listMine);
r.patch(
  "/:id/meta",
  requireRoles(ROLES.ADMIN, ROLES.AGENT_BANCAIRE, ROLES.CHEF_AGENCE, ROLES.COMITE_CREDIT),
  updateCreditMeta
);
r.get("/:id", getOne);
r.patch("/:id/status", transition);

export default r;
