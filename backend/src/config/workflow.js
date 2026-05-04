import { ROLES } from "../models/User.js";
import { CREDIT_STATUSES } from "../models/CreditRequest.js";

export const transitions = {
  [ROLES.CLIENT]: {
    BROUILLON: ["SOUMIS"],
    À_MODIFIER: ["SOUMIS"],
  },
  [ROLES.AGENT_BANCAIRE]: {
    SOUMIS: ["EN_ANALYSE"],
    EN_ANALYSE: ["EN_VALIDATION_CHEF", "À_MODIFIER", "REFUSÉ"],
  },
  [ROLES.CHEF_AGENCE]: {
    EN_VALIDATION_CHEF: ["EN_VALIDATION_COMITE", "APPROUVÉ", "REFUSÉ", "À_MODIFIER"],
  },
  [ROLES.COMITE_CREDIT]: {
    EN_VALIDATION_COMITE: ["APPROUVÉ", "REFUSÉ", "À_MODIFIER"],
  },
};

export function canTransition(role, from, to) {
  if (role === ROLES.ADMIN) return true;
  const map = transitions[role];
  if (!map) return false;
  return map[from]?.includes(to) ?? false;
}

export function getAllowedNextStatuses(role, current) {
  if (role === ROLES.ADMIN) {
    return CREDIT_STATUSES.filter((s) => s !== current);
  }
  const map = transitions[role];
  return map?.[current] || [];
}
