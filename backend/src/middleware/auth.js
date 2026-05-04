import jwt from "jsonwebtoken";
import User from "../models/User.js";

export function authRequired(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: "Authentification requise" });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub;
    req.userRole = payload.role;
    next();
  } catch {
    return res.status(401).json({ message: "Jeton invalide ou expiré" });
  }
}

export async function loadUser(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(401).json({ message: "Utilisateur introuvable" });
    req.user = user;
    next();
  } catch (e) {
    next(e);
  }
}

export function requireRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({ message: "Permission insuffisante" });
    }
    next();
  };
}

/** JWT optionnel : enrichit la requête si un jeton valide est présent (chatbot, simulation guidée). */
export function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub;
    req.userRole = payload.role;
  } catch {
    /* jeton absent ou invalide : continuer anonyme */
  }
  next();
}

export async function optionalLoadUser(req, res, next) {
  if (!req.userId) return next();
  try {
    const user = await User.findById(req.userId);
    req.user = user || null;
  } catch {
    req.user = null;
  }
  next();
}
