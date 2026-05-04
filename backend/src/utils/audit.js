import AuditLog from "../models/AuditLog.js";

export async function writeAudit({ userId, role, action, targetType, targetId, details, req }) {
  try {
    await AuditLog.create({
      userId,
      role,
      action,
      targetType,
      targetId,
      details,
      ip: req?.ip || req?.connection?.remoteAddress,
    });
  } catch (e) {
    console.error("Audit log failed", e);
  }
}
