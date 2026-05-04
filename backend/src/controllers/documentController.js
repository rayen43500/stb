import fs from "fs";
import path from "path";
import CreditRequest from "../models/CreditRequest.js";
import Document from "../models/Document.js";
import { ROLES } from "../models/User.js";
import { creditsDir } from "../middleware/upload.js";
import { writeAudit } from "../utils/audit.js";

async function canAccessCredit(req, creditId) {
  const doc = await CreditRequest.findById(creditId);
  if (!doc) return null;
  if (req.userRole === ROLES.CLIENT && doc.applicantId.toString() !== req.userId) return null;
  if (
    req.userRole === ROLES.CLIENT ||
    req.userRole === ROLES.AGENT_BANCAIRE ||
    req.userRole === ROLES.CHEF_AGENCE ||
    req.userRole === ROLES.COMITE_CREDIT ||
    req.userRole === ROLES.ADMIN
  ) {
    return doc;
  }
  return null;
}

export async function uploadForCredit(req, res, next) {
  try {
    const creditId = req.params.creditId;
    const credit = await canAccessCredit(req, creditId);
    if (!credit) return res.status(403).json({ message: "Accès refusé" });

    if (!req.file) return res.status(400).json({ message: "Fichier requis" });

    const storedPath = req.file.path;
    const relativeName = path.basename(storedPath);

    const d = await Document.create({
      creditRequestId: creditId,
      uploadedBy: req.userId,
      originalName: req.file.originalname,
      storedName: relativeName,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });

    await writeAudit({
      userId: req.userId,
      role: req.userRole,
      action: "DOCUMENT_UPLOAD",
      targetType: "CreditRequest",
      targetId: creditId,
      details: { documentId: d._id.toString(), name: req.file.originalname },
      req,
    });

    res.status(201).json(d);
  } catch (e) {
    next(e);
  }
}

export async function listForCredit(req, res, next) {
  try {
    const creditId = req.params.creditId;
    const credit = await canAccessCredit(req, creditId);
    if (!credit) return res.status(403).json({ message: "Accès refusé" });

    const items = await Document.find({ creditRequestId: creditId }).sort({ createdAt: -1 }).lean();
    res.json(items);
  } catch (e) {
    next(e);
  }
}

export async function downloadDocument(req, res, next) {
  try {
    const d = await Document.findById(req.params.id);
    if (!d) return res.status(404).json({ message: "Document introuvable" });
    const credit = await canAccessCredit(req, d.creditRequestId.toString());
    if (!credit) return res.status(403).json({ message: "Accès refusé" });
    const fullPath = path.join(creditsDir, d.storedName);
    if (!fs.existsSync(fullPath)) return res.status(404).json({ message: "Fichier manquant" });
    res.download(fullPath, d.originalName);
  } catch (e) {
    next(e);
  }
}

export async function removeDocument(req, res, next) {
  try {
    const d = await Document.findById(req.params.id);
    if (!d) return res.status(404).json({ message: "Document introuvable" });

    const credit = await canAccessCredit(req, d.creditRequestId.toString());
    if (!credit) return res.status(403).json({ message: "Accès refusé" });

    const isOwner = d.uploadedBy.toString() === req.userId;
    const isAdmin = req.userRole === ROLES.ADMIN;
    if (!isOwner && !isAdmin) return res.status(403).json({ message: "Suppression non autorisée" });

    const fullPath = path.join(creditsDir, d.storedName);
    fs.unlink(fullPath, () => {});

    await Document.deleteOne({ _id: d._id });

    await writeAudit({
      userId: req.userId,
      role: req.userRole,
      action: "DOCUMENT_DELETE",
      targetType: "Document",
      targetId: d._id.toString(),
      details: { creditRequestId: d.creditRequestId.toString() },
      req,
    });

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}
