import CreditRequest from "../models/CreditRequest.js";
import { AGENT_DOSSIER_STATUSES } from "../config/workflow.js";

export function lastMonthKeys(count = 6) {
  const keys = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

export function monthStartMonthsAgo(months) {
  const d = new Date();
  d.setMonth(d.getMonth() - (months - 1));
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function aggregateByMonth(match = {}, months = 6) {
  const keys = lastMonthKeys(months);
  const start = monthStartMonthsAgo(months);
  const rows = await CreditRequest.aggregate([
    { $match: { ...match, updatedAt: { $gte: start } } },
    { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$updatedAt" } }, count: { $sum: 1 } } },
  ]);
  const map = Object.fromEntries(rows.map((r) => [r._id, r.count]));
  return Object.fromEntries(keys.map((k) => [k, map[k] || 0]));
}

export async function aggregateAmountByMonth(match = {}, months = 6) {
  const keys = lastMonthKeys(months);
  const start = monthStartMonthsAgo(months);
  const rows = await CreditRequest.aggregate([
    { $match: { ...match, updatedAt: { $gte: start } } },
    { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$updatedAt" } }, total: { $sum: "$amount" } } },
  ]);
  const map = Object.fromEntries(rows.map((r) => [r._id, r.total]));
  return Object.fromEntries(keys.map((k) => [k, map[k] || 0]));
}

export function scoreDistributionFromCredits(credits) {
  const buckets = { "Score < 50": 0, "Score 50-79": 0, "Score ≥ 80": 0 };
  for (const c of credits) {
    const s = c.scoring?.score;
    if (s == null) continue;
    if (s < 50) buckets["Score < 50"] += 1;
    else if (s < 80) buckets["Score 50-79"] += 1;
    else buckets["Score ≥ 80"] += 1;
  }
  return buckets;
}

export function filterStatusMap(statusMap, statuses) {
  const out = {};
  for (const s of statuses) {
    if (statusMap[s]) out[s] = statusMap[s];
  }
  return out;
}

export const AGENT_STATUS_FILTER = AGENT_DOSSIER_STATUSES;
export const CHEF_STATUS_FILTER = ["EN_VALIDATION_CHEF", "EN_VALIDATION_COMITE", "APPROUVÉ", "REFUSÉ"];
