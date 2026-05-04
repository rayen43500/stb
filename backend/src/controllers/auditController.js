import AuditLog from "../models/AuditLog.js";

export async function listAuditLogs(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const skip = Number(req.query.skip) || 0;
    const items = await AuditLog.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
    const total = await AuditLog.countDocuments();
    res.json({ items, total, skip, limit });
  } catch (e) {
    next(e);
  }
}
