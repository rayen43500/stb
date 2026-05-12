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

/** Tableaux de bord métier : Agent, Chef, Comité, Admin — KPI + derniers dossiers + répartition risques / types. */
export async function workspaceStats(req, res, next) {
  try {
    const role = req.userRole;

    const byStatusAgg = await CreditRequest.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const statusMap = Object.fromEntries(byStatusAgg.map((x) => [x._id, x.count]));

    const riskAgg = await CreditRequest.aggregate([
      { $match: { "scoring.category": { $nin: [null, ""] } } },
      { $group: { _id: "$scoring.category", count: { $sum: 1 } } },
    ]);
    const byRisk = Object.fromEntries(riskAgg.map((x) => [x._id, x.count]));

    const typeAgg = await CreditRequest.aggregate([
      { $group: { _id: "$creditType", count: { $sum: 1 } } },
    ]);
    const byCreditType = Object.fromEntries(typeAgg.map((x) => [x._id || "CONSO", x.count]));

    const approvedSum = await CreditRequest.aggregate([
      { $match: { status: "APPROUVÉ" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const montantTotalAccorde = approvedSum[0]?.total ?? 0;

    const recentDocs = await CreditRequest.find()
      .sort({ updatedAt: -1 })
      .limit(8)
      .populate("applicantId", "firstName lastName email")
      .lean();

    const recent = recentDocs.map((r) => ({
      _id: r._id,
      status: r.status,
      amount: r.amount,
      creditType: r.creditType,
      updatedAt: r.updatedAt,
      scoring: r.scoring
        ? { score: r.scoring.score, category: r.scoring.category }
        : undefined,
      applicantId: r.applicantId,
    }));

    const approved = statusMap["APPROUVÉ"] || 0;
    const refused = statusMap["REFUSÉ"] || 0;
    const decided = approved + refused;
    const acceptanceRate = decided === 0 ? null : Math.round((approved / decided) * 1000) / 10;

    let kpis = {};
    if (role === ROLES.AGENT_BANCAIRE) {
      const soumis = statusMap["SOUMIS"] || 0;
      const aModifier = statusMap["À_MODIFIER"] || 0;
      const enAnalyse = statusMap["EN_ANALYSE"] || 0;
      kpis = {
        dossiersRecus: soumis,
        dossiersEnAttente: soumis + aModifier,
        dossiersEnvoyesScoring: enAnalyse,
        retournesClient: aModifier,
      };
    } else if (role === ROLES.CHEF_AGENCE) {
      kpis = {
        attenteValidationChef: statusMap["EN_VALIDATION_CHEF"] || 0,
        dossiersApprouves: approved,
        dossiersRefuses: refused,
        montantTotalAccorde,
      };
    } else if (role === ROLES.COMITE_CREDIT) {
      kpis = {
        attenteDecisionFinale: statusMap["EN_VALIDATION_COMITE"] || 0,
        dossiersApprouves: approved,
        dossiersRefuses: refused,
        montantTotalAccorde,
      };
    } else if (role === ROLES.ADMIN) {
      kpis = {
        dossiersRecus: statusMap["SOUMIS"] || 0,
        enAttente: statusMap["SOUMIS"] || 0,
        envoyesScoring: statusMap["EN_ANALYSE"] || 0,
        retournesClient: statusMap["À_MODIFIER"] || 0,
        attenteValidationChef: statusMap["EN_VALIDATION_CHEF"] || 0,
        attenteComite: statusMap["EN_VALIDATION_COMITE"] || 0,
        dossiersApprouves: approved,
        dossiersRefuses: refused,
        montantTotalAccorde,
      };
    }

    res.json({
      role,
      kpis,
      statusMap,
      byRisk,
      byCreditType,
      acceptanceRate,
      recent,
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
