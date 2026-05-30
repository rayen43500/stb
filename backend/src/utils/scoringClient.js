import axios from "axios";

const URL = process.env.SCORING_SERVICE_URL || "http://127.0.0.1:5001";

export async function callScoringService(payload) {
  try {
    const { data } = await axios.post(`${URL}/score`, payload, { timeout: 8000 });
    return data;
  } catch (err) {
    console.warn("Scoring service indisponible, repli sur règles locales.", err.message);
    return fallbackScore(payload);
  }
}

export async function callNlpParseService(text) {
  try {
    const { data } = await axios.post(
      `${URL}/nlp/parse`,
      { text: String(text || "") },
      { timeout: 8000 }
    );
    return data;
  } catch (err) {
    console.warn("NLP service indisponible, repli sur parser local.", err.message);
    return null;
  }
}

function decisionFromScore(score) {
  if (score >= 80) {
    return {
      decision: "ACCEPTE",
      decision_label_fr: "Profil globalement favorable (score ≥ 80).",
    };
  }
  if (score >= 50) {
    return {
      decision: "A_ANALYSER",
      decision_label_fr: "Profil à approfondir manuellement (score entre 50 et 79).",
    };
  }
  return {
    decision: "REFUS",
    decision_label_fr: "Risque élevé au vu des critères automatisés (score < 50).",
  };
}

function fallbackScore(p) {
  let score = 58;
  const factors = [];
  const weak = [];
  const actions = [];
  const inc = p.monthly_income || 0;

  if (inc >= 4000) {
    score += 14;
    factors.push("Revenus élevés");
  } else if (inc >= 2800) {
    score += 10;
    factors.push("Revenus confortables");
  } else if (inc >= 1800) {
    score += 5;
    factors.push("Revenus corrects");
  } else if (inc > 0 && inc < 1500) {
    score -= 8;
    weak.push("Revenus modestes");
    actions.push("Vérifier la stabilité des revenus ou un co-emprunteur.");
  }

  const ratio = p.debt_ratio_percent;
  if (ratio != null) {
    if (ratio <= 30) {
      score += 18;
      factors.push("Endettement maîtrisé");
    } else if (ratio <= 33) {
      score += 10;
      factors.push("Endettement dans les usages courants");
    } else if (ratio <= 40) {
      score -= 6;
      factors.push("Endettement modéré");
      actions.push("Envisager allonger la durée ou réduire le montant.");
    } else {
      score -= 28;
      weak.push("Taux d'endettement élevé après prêt");
      actions.push("Réduire le montant demandé ou l'apport ; rééchelonner la durée.");
    }
  }

  const ct = (p.contract_type || "").toUpperCase();
  if (ct === "CDI") {
    score += 12;
    factors.push("Contrat CDI");
  } else if (ct === "CDD") {
    score -= 10;
    weak.push("Contrat CDD");
    actions.push("Privilégier une durée de prêt alignée sur le terme du CDD.");
  } else if (ct === "INDEPENDANT") {
    score -= 4;
    factors.push("Profil indépendant");
  } else if (ct === "FONCTIONNAIRE") {
    score += 10;
    factors.push("Fonctionnaire — stabilité de l'emploi");
  } else if (ct === "AUTRE") {
    score -= 2;
    factors.push("Type de contrat atypique");
  }

  const sen = p.seniority_months || 0;
  if (sen >= 36) {
    score += 8;
    factors.push("Ancienneté solide");
  } else if (sen >= 12) {
    score += 4;
  } else {
    score -= 8;
    weak.push("Faible ancienneté");
    actions.push("Consolider la stabilité professionnelle avant accord.");
  }

  if ((p.prior_defaults || 0) > 0) {
    score -= 22;
    weak.push("Incidents de remboursement antérieurs");
    actions.push("Analyser le contexte des incidents et file active.");
  }
  if ((p.banking_incidents || 0) > 0) {
    score -= 12;
    weak.push("Incidents bancaires");
    actions.push("Contrôler les motifs d'incidents de paiement.");
  }

  score = Math.max(0, Math.min(100, score));
  const { decision, decision_label_fr } = decisionFromScore(score);
  const category = score >= 65 ? "FAIBLE" : score >= 40 ? "MOYEN" : "ELEVE";

  return {
    score,
    category,
    decision,
    decision_label_fr,
    top_factors: factors.slice(0, 6),
    weak_points: weak,
    recommended_actions: actions.slice(0, 4),
    justification: `Score de repli ${score}/100 — ${decision_label_fr} Endettement : ${ratio ?? "N/A"} %.`,
  };
}
