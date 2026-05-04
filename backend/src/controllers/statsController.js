import CreditRequest from "../models/CreditRequest.js";
import User, { ROLES } from "../models/User.js";

export async function dashboardStats(req, res, next) {
  try {
    const byStatus = await CreditRequest.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const statusMap = Object.fromEntries(byStatus.map((x) => [x._id, x.count]));
    const totalCredits = await CreditRequest.countDocuments();
    const totalUsers = await User.countDocuments();
    const approved = statusMap["APPROUVÉ"] || 0;
    const refused = statusMap["REFUSÉ"] || 0;
    const decided = approved + refused;
    const acceptanceRate = decided === 0 ? null : Math.round((approved / decided) * 1000) / 10;

    res.json({
      totalCredits,
      totalUsers,
      byStatus: statusMap,
      acceptanceRate,
    });
  } catch (e) {
    next(e);
  }
}

export const statsRoles = [
  ROLES.ADMIN,
  ROLES.AGENT_BANCAIRE,
  ROLES.CHEF_AGENCE,
  ROLES.COMITE_CREDIT,
];
