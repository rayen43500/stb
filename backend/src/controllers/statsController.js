import CreditRequest from "../models/CreditRequest.js";
import User, { ROLES } from "../models/User.js";
import {
  AGENT_STATUS_FILTER,
  CHEF_STATUS_FILTER,
  aggregateAmountByMonth,
  aggregateByMonth,
  filterStatusMap,
  scoreDistributionFromCredits,
} from "../utils/statsCharts.js";

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

    const byMonth = await aggregateByMonth();
    const amountByMonth = await aggregateAmountByMonth({ status: "APPROUVÉ" });
    const allScored = await CreditRequest.find({ "scoring.score": { $ne: null } })
      .select("scoring.score")
      .lean();
    const scoreDistribution = scoreDistributionFromCredits(allScored);

    let roleStatusMap = statusMap;
    if (role === ROLES.AGENT_BANCAIRE) {
      roleStatusMap = filterStatusMap(statusMap, AGENT_STATUS_FILTER);
    } else if (role === ROLES.CHEF_AGENCE) {
      roleStatusMap = filterStatusMap(statusMap, CHEF_STATUS_FILTER);
    }

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
    } else if (role === ROLES.ADMIN) {
      kpis = {
        totalDossiers: recentDocs.length ? await CreditRequest.countDocuments() : 0,
        totalUtilisateurs: await User.countDocuments(),
        dossiersApprouves: approved,
        montantTotalAccorde,
      };
    }
  

    res.json({
      role,
      kpis,
      statusMap,
      roleStatusMap,
      byRisk,
      byCreditType,
      byMonth,
      amountByMonth,
      scoreDistribution,
      acceptanceRate,
      recent,
    });
  } catch (e) {
    next(e);
  }
}

export const statsRoles = [
  
  ROLES.AGENT_BANCAIRE,
  ROLES.CHEF_AGENCE,
  ROLES.ADMIN,
];

/** KPI + données graphiques tableau de bord client. */
export async function clientDashboard(req, res, next) {
  try {
    const match = { applicantId: req.userId };
    const credits = await CreditRequest.find(match).lean();
    let demandesActives = 0;
    let enAttente = 0;
    let approuvees = 0;
    let montantTotal = 0;
    const statusMap = {};
    const byCreditType = {};
    const byRisk = {};

    for (const c of credits) {
      statusMap[c.status] = (statusMap[c.status] || 0) + 1;
      const t = c.creditType || "CONSO";
      byCreditType[t] = (byCreditType[t] || 0) + 1;
      const risk = c.scoring?.category;
      if (risk) byRisk[risk] = (byRisk[risk] || 0) + 1;

      if (c.status === "APPROUVÉ") {
        approuvees += 1;
        montantTotal += c.amount || 0;
      }
      if (["SOUMIS", "EN_ANALYSE", "EN_VALIDATION_CHEF", "À_MODIFIER"].includes(c.status)) {
        demandesActives += 1;
      }
      if (["SOUMIS", "EN_ANALYSE", "EN_VALIDATION_CHEF"].includes(c.status)) {
        enAttente += 1;
      }
    }

    const byMonth = await aggregateByMonth(match);
    const amountByMonth = await aggregateAmountByMonth({ ...match, status: "APPROUVÉ" });
    const scoreDistribution = scoreDistributionFromCredits(credits);
    const decided = approuvees + (statusMap["REFUSÉ"] || 0);
    const acceptanceRate = decided === 0 ? null : Math.round((approuvees / decided) * 1000) / 10;

    res.json({
      demandesActives,
      enAttente,
      approuvees,
      montantTotal,
      total: credits.length,
      statusMap,
      byCreditType,
      byRisk,
      byMonth,
      amountByMonth,
      scoreDistribution,
      acceptanceRate,
    });
  } catch (e) {
    next(e);
  }
}
