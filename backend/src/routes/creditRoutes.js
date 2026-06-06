import { Router } from "express";
import {
  simulate,
  createDraft,
  updateDraft,
  listMine,
  getOne,
  transition,
  allowedNext,
  amortissementPdf,
  contratPdf,
  decisionPdf,
  updateCreditMeta,
} from "../controllers/creditController.js";
import { authRequired, loadUser, requireRoles } from "../middleware/auth.js";
import { ROLES } from "../models/User.js";

const r = Router();

r.post("/simulate", simulate);

r.use(authRequired, loadUser);

r.get("/:id/allowed-next", allowedNext);
r.get("/:id/amortissement.pdf", amortissementPdf);
r.get("/:id/contrat.pdf", contratPdf);
r.get("/:id/decision.pdf", decisionPdf);

r.post("/", requireRoles(ROLES.CLIENT), createDraft);
r.patch("/:id/draft", requireRoles(ROLES.CLIENT), updateDraft);
r.get("/", listMine);
r.patch(
  "/:id/meta",
  requireRoles( ROLES.AGENT_BANCAIRE, ROLES.CHEF_AGENCE),
  updateCreditMeta
);
r.get("/:id", getOne);
r.patch("/:id/status", transition);

export default r;
