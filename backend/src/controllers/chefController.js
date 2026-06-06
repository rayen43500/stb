import crypto from "crypto";
import bcrypt from "bcryptjs";
import PDFDocument from "pdfkit";
import User, { ROLES } from "../models/User.js";
import CreditRequest from "../models/CreditRequest.js";
import { sendOptionalEmail } from "../utils/mail.js";
import { sendClientActivationEmail } from "../utils/activationEmail.js";
import { notifyUser } from "../utils/notify.js";
import { writeAudit } from "../utils/audit.js";

function generateActivationCode() {
  return crypto.randomInt(100000, 999999).toString();
}

function generateTempPassword() {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

/** Inscriptions clients en attente de validation. */
export async function listPendingClients(req, res, next) {
  try {
    const clients = await User.find({ role: ROLES.CLIENT, accountStatus: "PENDING" })
      .sort({ createdAt: -1 })
      .select("email firstName lastName phone nationalId dateOfBirth createdAt");
    res.json(clients);
  } catch (e) {
    next(e);
  }
}

/** Valider une inscription client — envoi code activation par email. */
export async function approveClient(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== ROLES.CLIENT) {
      return res.status(404).json({ message: "Client introuvable" });
    }
    if (user.accountStatus !== "PENDING") {
      return res.status(400).json({ message: "Ce compte n'est pas en attente de validation" });
    }

    const code = generateActivationCode();
    user.activationCode = code;
    user.activationCodeExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await user.save();

    await sendClientActivationEmail(user, code, { reason: "resend" });

    await notifyUser(user._id, {
      type: "ACCOUNT_APPROVED",
      title: "Inscription validée",
      message: "Votre compte a été validé. Consultez votre email pour le code d'activation.",
      link: "/activate",
      sendEmail: false,
    });

    await writeAudit({
      userId: req.userId,
      role: req.userRole,
      action: "CLIENT_APPROVE",
      targetType: "User",
      targetId: user._id.toString(),
      details: { email: user.email },
      req,
    });

    res.json({ ok: true, message: "Code d'activation envoyé au client" });
  } catch (e) {
    next(e);
  }
}

/** Refuser une inscription client. */
export async function rejectClient(req, res, next) {
  try {
    const { reason } = req.body;
    if (!reason?.trim()) {
      return res.status(400).json({ message: "Motif de refus obligatoire" });
    }
    const user = await User.findById(req.params.id);
    if (!user || user.role !== ROLES.CLIENT) {
      return res.status(404).json({ message: "Client introuvable" });
    }
    user.accountStatus = "REJECTED";
    user.rejectionReason = reason.trim();
    user.activationCode = undefined;
    user.activationCodeExpires = undefined;
    await user.save();

    await sendOptionalEmail({
      to: user.email,
      subject: "STB Crédits — Inscription refusée",
      text: `Bonjour,\n\nVotre demande d'inscription a été refusée.\nMotif : ${reason.trim()}\n\nCordialement,\nVotre agence STB`,
    });

    await writeAudit({
      userId: req.userId,
      role: req.userRole,
      action: "CLIENT_REJECT",
      targetType: "User",
      targetId: user._id.toString(),
      details: { reason: reason.trim() },
      req,
    });

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

/** Créer un compte agent (ou personnel) avec mot de passe temporaire. */
export async function createStaffAccount(req, res, next) {
  try {
    const { email, firstName, lastName, matricule, role, agencyName } = req.body;
    if (!email || !firstName || !lastName || !matricule) {
      return res.status(400).json({ message: "Email, nom, prénom et matricule requis" });
    }
    const allowedRoles = [ROLES.AGENT_BANCAIRE, ROLES.CHEF_AGENCE];
    const finalRole = allowedRoles.includes(role) ? role : ROLES.AGENT_BANCAIRE;

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(409).json({ message: "Email déjà utilisé" });

    const tempPassword = generateTempPassword();
    const user = await User.create({
      email,
      passwordHash: await bcrypt.hash(tempPassword, 10),
      role: finalRole,
      accountStatus: "ACTIVE",
      firstName,
      lastName,
      matricule,
      staffProfile: agencyName ? { agencyName } : undefined,
    });

    await sendOptionalEmail({
      to: user.email,
      subject: "STB Crédits — Vos identifiants de connexion",
      text: `Bonjour ${firstName},\n\nVotre compte STB Crédits a été créé.\nEmail : ${email}\nMot de passe temporaire : ${tempPassword}\n\nConnectez-vous et changez votre mot de passe dans Paramètres.\n\nCordialement,\nVotre agence STB`,
    });

    await writeAudit({
      userId: req.userId,
      role: req.userRole,
      action: "STAFF_CREATE",
      targetType: "User",
      targetId: user._id.toString(),
      details: { email, role: finalRole },
      req,
    });

    res.status(201).json({ user: user.toSafeJSON(), tempPassword });
  } catch (e) {
    next(e);
  }
}

/** Liste des agents de l'agence avec statistiques de traitement. */
export async function listAgents(req, res, next) {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(startOfDay.getFullYear(), startOfDay.getMonth(), 1);

    const agents = await User.find({ role: ROLES.AGENT_BANCAIRE, accountStatus: "ACTIVE" })
      .select("email firstName lastName matricule staffProfile createdAt")
      .lean();

    const credits = await CreditRequest.find({ "comments.role": ROLES.AGENT_BANCAIRE })
      .select("comments updatedAt")
      .lean();

    const result = agents.map((agent) => {
      let today = 0;
      let month = 0;
      for (const c of credits) {
        for (const cm of c.comments || []) {
          if (cm.role !== ROLES.AGENT_BANCAIRE) continue;
          const t = cm.createdAt ? new Date(cm.createdAt) : null;
          if (!t) continue;
          if (t >= startOfDay) today += 1;
          if (t >= startOfMonth) month += 1;
        }
      }
      return {
        ...agent,
        id: agent._id.toString(),
        dossiersTraitesAujourdhui: today,
        dossiersTraitesMois: month,
        statut: "actif",
      };
    });

    res.json(result);
  } catch (e) {
    next(e);
  }
}

/** Données synthèse pour rapports mensuels. */
export async function monthlyReport(req, res, next) {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const dossiers = await CreditRequest.find({ updatedAt: { $gte: startOfMonth } }).lean();
    const approved = dossiers.filter((d) => d.status === "APPROUVÉ");
    const refused = dossiers.filter((d) => d.status === "REFUSÉ");
    const montantApprouve = approved.reduce((s, d) => s + (d.amount || 0), 0);

    const scored = dossiers.filter((d) => d.scoring?.score != null);
    const avgScore =
      scored.length === 0
        ? null
        : Math.round((scored.reduce((s, d) => s + d.scoring.score, 0) / scored.length) * 10) / 10;

    res.json({
      periode: { from: startOfMonth.toISOString(), to: now.toISOString() },
      totalDossiers: dossiers.length,
      approuves: approved.length,
      refuses: refused.length,
      montantApprouve,
      scoreMoyen: avgScore,
      dossiers: dossiers.map((d) => ({
        _id: d._id,
        status: d.status,
        amount: d.amount,
        creditType: d.creditType,
        score: d.scoring?.score,
        updatedAt: d.updatedAt,
      })),
    });
  } catch (e) {
    next(e);
  }
}

/** Export PDF du rapport mensuel. */
export async function monthlyReportPdf(req, res, next) {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const dossiers = await CreditRequest.find({ updatedAt: { $gte: startOfMonth } }).lean();
    const approved = dossiers.filter((d) => d.status === "APPROUVÉ");
    const refused = dossiers.filter((d) => d.status === "REFUSÉ");
    const montantApprouve = approved.reduce((s, d) => s + (d.amount || 0), 0);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="rapport-agence-${now.toISOString().slice(0, 7)}.pdf"`
    );

    const pdf = new PDFDocument({ margin: 40 });
    pdf.pipe(res);
    pdf.fontSize(16).text("Rapport mensuel — Agence STB Crédits", { underline: true });
    pdf.moveDown();
    pdf.fontSize(10).text(`Période : ${startOfMonth.toLocaleDateString("fr-TN")} — ${now.toLocaleDateString("fr-TN")}`);
    pdf.moveDown();
    pdf.text(`Dossiers traités : ${dossiers.length}`);
    pdf.text(`Approuvés : ${approved.length} — Refusés : ${refused.length}`);
    pdf.text(`Montant total accordé : ${montantApprouve.toFixed(3)} TND`);
    pdf.moveDown();
    pdf.text("Liste des dossiers :");
    dossiers.slice(0, 50).forEach((d) => {
      pdf.text(
        `• ${d._id.toString().slice(-8)} | ${d.status} | ${d.amount} TND | Score ${d.scoring?.score ?? "—"}`
      );
    });
    pdf.end();
  } catch (e) {
    next(e);
  }
}
