import PDFDocument from "pdfkit";
import CreditRequest, { CREDIT_STATUSES, CREDIT_TYPES } from "../models/CreditRequest.js";
import User, { ROLES } from "../models/User.js";
import { runSimulation } from "../utils/simulation.js";
import { callScoringService } from "../utils/scoringClient.js";
import { canTransition, getAllowedNextStatuses } from "../config/workflow.js";
import { writeAudit } from "../utils/audit.js";
import { notifyCreditEvent, notifyStaffByRole } from "../utils/notify.js";
import { buildAmortizationSchedule } from "../utils/amortization.js";

function assertComment(body) {
  const c = body?.comment?.trim();
  if (!c) {
    const err = new Error("Commentaire obligatoire pour cette action");
    err.status = 400;
    throw err;
  }
  return c;
}

export async function simulate(req, res, next) {
  try {
    const { amount, durationMonths, annualRatePercent, monthlyIncome, monthlyCharges } = req.body;
    if ([amount, durationMonths, annualRatePercent].some((v) => v == null)) {
      return res.status(400).json({ message: "Montant, durée et taux requis" });
    }
    const result = runSimulation({
      amount: Number(amount),
      durationMonths: Number(durationMonths),
      annualRatePercent: Number(annualRatePercent),
      monthlyIncome: monthlyIncome != null ? Number(monthlyIncome) : null,
      monthlyCharges: monthlyCharges != null ? Number(monthlyCharges) : 0,
    });
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function allowedNext(req, res, next) {
  try {
    const doc = await CreditRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Dossier introuvable" });
    if (req.userRole === ROLES.CLIENT && doc.applicantId.toString() !== req.userId) {
      return res.status(403).json({ message: "Accès refusé" });
    }
    const nextStatuses = getAllowedNextStatuses(req.userRole, doc.status);
    res.json({ current: doc.status, allowedNext: nextStatuses });
  } catch (e) {
    next(e);
  }
}

export async function amortissementPdf(req, res, next) {
  try {
    const doc = await CreditRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Dossier introuvable" });
    if (req.userRole === ROLES.CLIENT && doc.applicantId.toString() !== req.userId) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    const { rows, monthlyPayment } = buildAmortizationSchedule(
      doc.amount,
      doc.annualRatePercent,
      doc.durationMonths
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="amortissement-${doc._id}.pdf"`);

    const pdf = new PDFDocument({ margin: 40 });
    pdf.pipe(res);
    pdf.fontSize(16).text("Tableau d'amortissement STB", { underline: true });
    pdf.moveDown();
    pdf.fontSize(10).text(`Capital : ${doc.amount} TND — Durée : ${doc.durationMonths} mois — Taux : ${doc.annualRatePercent}%`);
    pdf.text(`Mensualité constante : ${monthlyPayment.toFixed(3)} TND`);
    pdf.moveDown();
    pdf.fontSize(9);
    rows.slice(0, 120).forEach((row) => {
      pdf.text(
        `Mois ${row.month} | Mens. ${row.payment.toFixed(3)} TND | Int. ${row.interest.toFixed(3)} | Cap. ${row.principal.toFixed(3)} | Reste ${row.balance.toFixed(3)}`
      );
    });
    if (rows.length > 120) pdf.text(`… ${rows.length - 120} lignes supplémentaires (extrait)`);
    pdf.end();
  } catch (e) {
    next(e);
  }
}

export async function createDraft(req, res, next) {
  try {
    const { amount, durationMonths, annualRatePercent, creditType, creditPurpose } = req.body;
    if ([amount, durationMonths, annualRatePercent].some((v) => v == null)) {
      return res.status(400).json({ message: "Montant, durée et taux requis" });
    }
    const applicant = await User.findById(req.userId);
    const inc = applicant?.clientProfile?.monthlyIncome;
    const chg = applicant?.clientProfile?.monthlyCharges ?? 0;
    const sim = runSimulation({
      amount: Number(amount),
      durationMonths: Number(durationMonths),
      annualRatePercent: Number(annualRatePercent),
      monthlyIncome: inc,
      monthlyCharges: chg,
    });
    const ct = creditType && CREDIT_TYPES.includes(creditType) ? creditType : "CONSO";
    const doc = await CreditRequest.create({
      applicantId: req.userId,
      amount: Number(amount),
      durationMonths: Number(durationMonths),
      annualRatePercent: Number(annualRatePercent),
      creditType: ct,
      creditPurpose: creditPurpose?.trim() || undefined,
      monthlyPayment: sim.monthlyPayment,
      totalCost: sim.totalCostInterest,
      debtRatioPercent: sim.debtRatioPercent,
      simulationRiskLabel: sim.simulationRiskLabel,
      recommendations: sim.recommendations,
      status: "BROUILLON",
    });

    await writeAudit({
      userId: req.userId,
      role: req.userRole,
      action: "CREDIT_CREATE_DRAFT",
      targetType: "CreditRequest",
      targetId: doc._id.toString(),
      details: { amount: doc.amount, status: doc.status },
      req,
    });

    res.status(201).json(doc);
  } catch (e) {
    next(e);
  }
}

/** Mise à jour d'un brouillon par le client (avant soumission). */
export async function updateDraft(req, res, next) {
  try {
    const doc = await CreditRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Dossier introuvable" });
    if (doc.applicantId.toString() !== req.userId) {
      return res.status(403).json({ message: "Accès refusé" });
    }
    if (doc.status !== "BROUILLON" && doc.status !== "À_MODIFIER") {
      return res.status(400).json({ message: "Seuls les brouillons ou dossiers à modifier sont éditables" });
    }

    const { amount, durationMonths, annualRatePercent, creditType, creditPurpose } = req.body || {};
    if (amount != null) doc.amount = Number(amount);
    if (durationMonths != null) doc.durationMonths = Number(durationMonths);
    if (annualRatePercent != null) doc.annualRatePercent = Number(annualRatePercent);
    if (creditType != null && CREDIT_TYPES.includes(creditType)) doc.creditType = creditType;
    if (creditPurpose !== undefined) doc.creditPurpose = creditPurpose?.trim() || undefined;

    const applicant = await User.findById(req.userId);
    const inc = applicant?.clientProfile?.monthlyIncome;
    const chg = applicant?.clientProfile?.monthlyCharges ?? 0;
    const sim = runSimulation({
      amount: doc.amount,
      durationMonths: doc.durationMonths,
      annualRatePercent: doc.annualRatePercent,
      monthlyIncome: inc,
      monthlyCharges: chg,
    });
    doc.monthlyPayment = sim.monthlyPayment;
    doc.totalCost = sim.totalCostInterest;
    doc.debtRatioPercent = sim.debtRatioPercent;
    doc.simulationRiskLabel = sim.simulationRiskLabel;
    doc.recommendations = sim.recommendations;

    await doc.save();
    res.json(doc);
  } catch (e) {
    next(e);
  }
}

export async function contratPdf(req, res, next) {
  try {
    const doc = await CreditRequest.findById(req.params.id).populate(
      "applicantId",
      "firstName lastName nationalId email"
    );
    if (!doc) return res.status(404).json({ message: "Dossier introuvable" });
    if (req.userRole === ROLES.CLIENT && doc.applicantId._id.toString() !== req.userId) {
      return res.status(403).json({ message: "Accès refusé" });
    }
    if (doc.status !== "APPROUVÉ") {
      return res.status(400).json({ message: "Contrat disponible uniquement pour les dossiers approuvés" });
    }

    const applicant = doc.applicantId;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="contrat-${doc._id}.pdf"`);

    const pdf = new PDFDocument({ margin: 40 });
    pdf.pipe(res);
    pdf.fontSize(16).text("CONTRAT DE CRÉDIT STB", { align: "center", underline: true });
    pdf.moveDown();
    pdf.fontSize(10);
    pdf.text(`Référence dossier : ${doc._id}`);
    pdf.text(`Date : ${new Date().toLocaleDateString("fr-TN")}`);
    pdf.moveDown();
    pdf.text(
      `Emprunteur : ${applicant.firstName || ""} ${applicant.lastName || ""} — CIN : ${applicant.nationalId || "—"}`
    );
    pdf.text(`Email : ${applicant.email || "—"}`);
    pdf.moveDown();
    pdf.text(`Type de crédit : ${doc.creditType}`);
    pdf.text(`Montant : ${doc.amount} TND`);
    pdf.text(`Durée : ${doc.durationMonths} mois`);
    pdf.text(`Taux annuel : ${doc.annualRatePercent}%`);
    pdf.text(`Mensualité : ${doc.monthlyPayment?.toFixed(3) ?? "—"} TND`);
    if (doc.creditPurpose) pdf.text(`Objet : ${doc.creditPurpose}`);
    pdf.moveDown();
    pdf.text(
      "Le présent contrat est généré automatiquement suite à l'approbation du dossier par le chef d'agence. " +
        "Les conditions générales de crédit STB s'appliquent."
    );
    pdf.end();
  } catch (e) {
    next(e);
  }
}

export async function decisionPdf(req, res, next) {
  try {
    const doc = await CreditRequest.findById(req.params.id).populate(
      "applicantId",
      "firstName lastName nationalId"
    );
    if (!doc) return res.status(404).json({ message: "Dossier introuvable" });
    if (req.userRole === ROLES.CLIENT && doc.applicantId._id.toString() !== req.userId) {
      return res.status(403).json({ message: "Accès refusé" });
    }
    if (doc.status !== "APPROUVÉ" && doc.status !== "REFUSÉ") {
      return res.status(400).json({ message: "Fiche de décision disponible après décision finale" });
    }

    const chefComment = (doc.comments || []).filter((c) => c.role === ROLES.CHEF_AGENCE).pop();
    const applicant = doc.applicantId;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="decision-${doc._id}.pdf"`);

    const pdf = new PDFDocument({ margin: 40 });
    pdf.pipe(res);
    pdf.fontSize(16).text("FICHE DE DÉCISION — CHEF D'AGENCE", { align: "center", underline: true });
    pdf.moveDown();
    pdf.fontSize(10);
    pdf.text(`Dossier : ${doc._id.toString().slice(-8)}`);
    pdf.text(`Client : ${applicant.firstName || ""} ${applicant.lastName || ""}`);
    pdf.text(`Décision : ${doc.status}`);
    pdf.text(`Montant : ${doc.amount} TND — ${doc.durationMonths} mois`);
    if (doc.scoring?.score != null) {
      pdf.text(`Score IA : ${doc.scoring.score}/100 — Risque : ${doc.scoring.category || "—"}`);
    }
    pdf.moveDown();
    pdf.text("Motif / commentaire chef d'agence :");
    pdf.text(chefComment?.text || "—");
    pdf.end();
  } catch (e) {
    next(e);
  }
}

export async function updateCreditMeta(req, res, next) {
  try {
    const doc = await CreditRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Dossier introuvable" });

    const staffRoles = [
      
      ROLES.AGENT_BANCAIRE,
      ROLES.CHEF_AGENCE,
      
    ];
    if (!staffRoles.includes(req.userRole)) {
      return res.status(403).json({ message: "Réservé au personnel banque" });
    }

    const { creditType, documentVerification, bankingIncidents, priorDefaults } = req.body || {};
    if (creditType != null && CREDIT_TYPES.includes(creditType)) {
      doc.creditType = creditType;
    }

    const canEditDocs = req.userRole === ROLES.AGENT_BANCAIRE;
    if (documentVerification && typeof documentVerification === "object" && canEditDocs) {
      doc.documentVerification = doc.documentVerification || {};
      for (const key of ["cin", "payslip", "contract", "bankStatement"]) {
        if (typeof documentVerification[key] === "boolean") {
          doc.documentVerification[key] = documentVerification[key];
        }
      }
      doc.markModified("documentVerification");
    }

    const canEditIncidents =  req.userRole === ROLES.AGENT_BANCAIRE;
    if (canEditIncidents && (bankingIncidents != null || priorDefaults != null)) {
      const applicant = await User.findById(doc.applicantId);
      if (applicant) {
        applicant.clientProfile = applicant.clientProfile || {};
        if (bankingIncidents != null) applicant.clientProfile.bankingIncidents = Number(bankingIncidents);
        if (priorDefaults != null) applicant.clientProfile.priorDefaults = Number(priorDefaults);
        applicant.markModified("clientProfile");
        await applicant.save();
      }
    }

    await doc.save();

    await writeAudit({
      userId: req.userId,
      role: req.userRole,
      action: "CREDIT_META_UPDATE",
      targetType: "CreditRequest",
      targetId: doc._id.toString(),
      details: { creditType: doc.creditType, documentVerification: doc.documentVerification },
      req,
    });

    const out = await CreditRequest.findById(doc._id).populate(
      "applicantId",
      "email firstName lastName role clientProfile nationalId phone addressLine1 city staffProfile"
    );
    res.json(out);
  } catch (e) {
    next(e);
  }
}

export async function listMine(req, res, next) {
  try {
    const q = req.userRole === ROLES.CLIENT ? { applicantId: req.userId } : {};
    const items = await CreditRequest.find(q).sort({ updatedAt: -1 }).populate("applicantId", "email firstName lastName role");
    res.json(items);
  } catch (e) {
    next(e);
  }
}

export async function getOne(req, res, next) {
  try {
    const doc = await CreditRequest.findById(req.params.id).populate(
      "applicantId",
      "email firstName lastName role clientProfile nationalId phone addressLine1 addressLine2 city postalCode country staffProfile"
    );
    if (!doc) return res.status(404).json({ message: "Dossier introuvable" });
    if (req.userRole === ROLES.CLIENT && doc.applicantId._id.toString() !== req.userId) {
      return res.status(403).json({ message: "Accès refusé" });
    }
    res.json(doc);
  } catch (e) {
    next(e);
  }
}

export async function transition(req, res, next) {
  try {
    const { nextStatus } = req.body;
    const comment = assertComment(req.body);
    const doc = await CreditRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Dossier introuvable" });
    if (req.userRole === ROLES.CLIENT && doc.applicantId.toString() !== req.userId) {
      return res.status(403).json({ message: "Accès refusé" });
    }
    if (!CREDIT_STATUSES.includes(nextStatus)) {
      return res.status(400).json({ message: "Statut cible invalide" });
    }
    if (!canTransition(req.userRole, doc.status, nextStatus)) {
      return res.status(400).json({ message: "Transition non autorisée pour ce rôle" });
    }

    const prevStatus = doc.status;

    if (nextStatus === "EN_ANALYSE") {
      const applicant = await User.findById(doc.applicantId);
      const cp = applicant?.clientProfile || {};
      const sim = runSimulation({
        amount: doc.amount,
        durationMonths: doc.durationMonths,
        annualRatePercent: doc.annualRatePercent,
        monthlyIncome: cp.monthlyIncome,
        monthlyCharges: cp.monthlyCharges ?? 0,
      });
      doc.debtRatioPercent = sim.debtRatioPercent;
      doc.monthlyPayment = sim.monthlyPayment;
      doc.simulationRiskLabel = sim.simulationRiskLabel;

      const scoringPayload = {
        monthly_income: cp.monthlyIncome,
        monthly_charges: cp.monthlyCharges ?? 0,
        debt_ratio_percent: doc.debtRatioPercent,
        contract_type: cp.contractType,
        seniority_months: cp.seniorityMonths,
        prior_defaults: cp.priorDefaults,
        banking_incidents: cp.bankingIncidents,
      };
      const scoring = await callScoringService(scoringPayload);
      doc.scoring = {
        score: scoring.score,
        category: scoring.category,
        decision: scoring.decision,
        decisionLabelFr: scoring.decision_label_fr || scoring.decisionLabelFr,
        topFactors: scoring.top_factors || scoring.topFactors,
        weakPoints: scoring.weak_points || scoring.weakPoints,
        recommendedActions: scoring.recommended_actions || scoring.recommendedActions,
        justification: scoring.justification,
      };
    }

    doc.status = nextStatus;
    doc.comments.push({
      userId: req.userId,
      role: req.userRole,
      text: comment,
      action: `STATUT:${nextStatus}`,
    });
    await doc.save();

    await writeAudit({
      userId: req.userId,
      role: req.userRole,
      action: "CREDIT_TRANSITION",
      targetType: "CreditRequest",
      targetId: doc._id.toString(),
      details: { from: prevStatus, to: nextStatus },
      req,
    });

    await notifyCreditEvent(doc.applicantId, {
      type: "CREDIT_STATUS",
      title: `Dossier crédit : ${nextStatus}`,
      message: `Votre dossier est passé à l'état « ${nextStatus} ». Commentaire agence : ${comment}`,
      link: `/dossiers/${doc._id}`,
    });

    if (nextStatus === "SOUMIS") {
      await notifyStaffByRole(ROLES.AGENT_BANCAIRE, {
        type: "NEW_DOSSIER",
        title: "Nouveau dossier soumis",
        message: `Dossier ${doc._id.toString().slice(-8)} en attente de traitement.`,
        link: `/dossiers/${doc._id}`,
      });
    }
    if (nextStatus === "EN_VALIDATION_CHEF") {
      await notifyStaffByRole(ROLES.CHEF_AGENCE, {
        type: "DOSSIER_CHEF",
        title: "Dossier en validation chef",
        message: `Dossier ${doc._id.toString().slice(-8)} transmis pour décision finale.`,
        link: `/dossiers/${doc._id}`,
      });
    }

    res.json(doc);
  } catch (e) {
    next(e);
  }
}
