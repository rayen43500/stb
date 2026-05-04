import User, { ROLES } from "../models/User.js";

export async function updateMyProfile(req, res, next) {
  try {
    if (req.userRole !== ROLES.CLIENT) {
      return res.status(403).json({ message: "Réservé aux clients" });
    }
    const allowed = [
      "firstName",
      "lastName",
      "phone",
      "monthlyIncome",
      "monthlyCharges",
      "contractType",
      "seniorityMonths",
      "priorDefaults",
      "bankingIncidents",
    ];
    const body = req.body || {};
    const profileKeys = new Set([
      "monthlyIncome",
      "monthlyCharges",
      "contractType",
      "seniorityMonths",
      "priorDefaults",
      "bankingIncidents",
    ]);

    for (const key of Object.keys(body)) {
      if (!allowed.includes(key)) continue;
      if (profileKeys.has(key)) {
        req.user.clientProfile = req.user.clientProfile || {};
        req.user.clientProfile[key] = body[key];
      } else {
        req.user[key] = body[key];
      }
    }
    req.user.markModified("clientProfile");
    await req.user.save();
    res.json({ user: req.user.toSafeJSON() });
  } catch (e) {
    next(e);
  }
}
