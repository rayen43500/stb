import { ROLES } from "../models/User.js";

/** Dossiers encore sous la responsabilité de l'agent (analyse des pièces). */
export const AGENT_DOSSIER_STATUSES = ["SOUMIS", "EN_ANALYSE", "À_MODIFIER"];

export const transitions = {
  [ROLES.CLIENT]: {
    BROUILLON: ["SOUMIS"],
    À_MODIFIER: ["SOUMIS"],
  },
  [ROLES.AGENT_BANCAIRE]: {
    SOUMIS: ["EN_ANALYSE", "À_MODIFIER"],
    EN_ANALYSE: ["EN_VALIDATION_CHEF", "À_MODIFIER"],
  },
  [ROLES.CHEF_AGENCE]: {
    EN_VALIDATION_CHEF: ["EN_VALIDATION_COMITE", "APPROUVÉ", "REFUSÉ", "À_MODIFIER"],
  },
};

export function canTransition(role, from, to) {
  const map = transitions[role];
  if (!map) return false;
  return map[from]?.includes(to) ?? false;
}

export function getAllowedNextStatuses(role, current) {
  const map = transitions[role];
  return map?.[current] || [];
}
