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
      "nationalId",
      "addressLine1",
      "addressLine2",
      "city",
      "postalCode",
      "country",
      "dateOfBirth",
      "maritalStatus",
      "profession",
      "employerName",
      "monthlyIncome",
      "monthlyCharges",
      "existingCredits",
      "additionalIncome",
      "contractType",
      "seniorityMonths",
      "priorDefaults",
      "bankingIncidents",
    ];
    const body = req.body || {};
    const profileKeys = new Set([
      "maritalStatus",
      "profession",
      "employerName",
      "monthlyIncome",
      "monthlyCharges",
      "existingCredits",
      "additionalIncome",
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
      } else if (key === "dateOfBirth") {
        req.user.dateOfBirth = body[key] ? new Date(body[key]) : undefined;
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
