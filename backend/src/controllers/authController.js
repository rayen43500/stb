import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User, { ROLES } from "../models/User.js";
import { notifyStaffByRole } from "../utils/notify.js";
import { sendClientActivationEmail } from "../utils/activationEmail.js";

function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function generateActivationCode() {
  return crypto.randomInt(100000, 999999).toString();
}

const ACTIVATION_TTL_MS = 48 * 60 * 60 * 1000;

async function issueActivationCode(user) {
  const code = generateActivationCode();
  user.activationCode = code;
  user.activationCodeExpires = new Date(Date.now() + ACTIVATION_TTL_MS);
  await user.save();
  return code;
}

/** Inscription client publique — email de vérification avec lien SMTP. */
export async function register(req, res, next) {
  try {
    const { email, password, firstName, lastName, phone, nationalId, dateOfBirth } = req.body;
    if (!email || !firstName || !lastName || !nationalId) {
      return res.status(400).json({
        message: "Email, nom, prénom et CIN sont obligatoires",
      });
    }
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(409).json({ message: "Email déjà utilisé" });

    const passwordHash = password
      ? await bcrypt.hash(password, 10)
      : await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);

    const user = await User.create({
      email,
      passwordHash,
      role: ROLES.CLIENT,
      accountStatus: "PENDING",
      firstName,
      lastName,
      phone,
      nationalId,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
    });

    const code = await issueActivationCode(user);
    const emailSent = await sendClientActivationEmail(user, code, { reason: "registration" });

    await notifyStaffByRole(ROLES.CHEF_AGENCE, {
      type: "CLIENT_REGISTRATION",
      title: "Nouvelle inscription client",
      message: `${firstName} ${lastName} (${email}) — vérification email en cours.`,
      link: "/chef/comptes",
    });

    res.status(201).json({
      message: emailSent
        ? "Inscription enregistrée. Consultez votre email et cliquez sur le lien pour activer votre compte."
        : "Inscription enregistrée. Email non configuré (SMTP) : utilisez la page d'activation avec le code affiché en console serveur.",
      pending: true,
      userId: user._id.toString(),
      emailSent,
      ...(process.env.NODE_ENV !== "production" && !emailSent ? { devCode: code } : {}),
    });
  } catch (e) {
    next(e);
  }
}

/** Renvoyer l'email de vérification (compte PENDING). */
export async function resendActivation(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email requis" });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.json({ message: "Si un compte existe, un email de vérification a été envoyé." });
    }
    if (user.accountStatus === "ACTIVE") {
      return res.status(400).json({ message: "Compte déjà activé — connectez-vous" });
    }
    if (user.accountStatus === "REJECTED") {
      return res.status(403).json({ message: "Inscription refusée par l'agence" });
    }

    const code = await issueActivationCode(user);
    const emailSent = await sendClientActivationEmail(user, code, { reason: "resend" });

    res.json({
      message: emailSent
        ? "Email de vérification renvoyé. Consultez votre boîte de réception."
        : "SMTP non configuré — contactez l'administrateur.",
      emailSent,
      ...(process.env.NODE_ENV !== "production" && !emailSent ? { devCode: code } : {}),
    });
  } catch (e) {
    next(e);
  }
}

/** Activation du compte avec code (lien email) + définition du mot de passe. */
export async function activateAccount(req, res, next) {
  try {
    const { email, code, password } = req.body;
    if (!email || !code || !password || String(password).length < 8) {
      return res.status(400).json({
        message: "Email, code d'activation et mot de passe (8 caractères min.) requis",
      });
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ message: "Compte introuvable" });
    if (user.accountStatus === "REJECTED") {
      return res.status(403).json({ message: "Inscription refusée par l'agence" });
    }
    if (user.accountStatus === "ACTIVE") {
      return res.status(400).json({ message: "Compte déjà activé — connectez-vous" });
    }
    if (!user.activationCode || user.activationCode !== String(code).trim()) {
      return res.status(400).json({ message: "Code d'activation invalide" });
    }
    if (user.activationCodeExpires && user.activationCodeExpires < new Date()) {
      return res.status(400).json({ message: "Lien expiré — demandez un nouvel email de vérification" });
    }

    user.passwordHash = await bcrypt.hash(String(password), 10);
    user.accountStatus = "ACTIVE";
    user.activationCode = undefined;
    user.activationCodeExpires = undefined;
    await user.save();

    const token = signToken(user);
    res.json({ token, user: user.toSafeJSON() });
  } catch (e) {
    next(e);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase()?.trim() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Identifiants invalides" });
    }
    if (user.accountStatus === "PENDING") {
      return res.status(403).json({
        message:
          "Compte non vérifié. Consultez votre email et cliquez sur le lien d'activation, ou renvoyez l'email de vérification.",
        pending: true,
      });
    }
    if (user.accountStatus === "REJECTED") {
      return res.status(403).json({ message: "Compte refusé par l'agence" });
    }
    const token = signToken(user);
    res.json({ token, user: user.toSafeJSON() });
  } catch (e) {
    next(e);
  }
}

export async function me(req, res) {
  res.json({ user: req.user.toSafeJSON() });
}
