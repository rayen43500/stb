/**
 * Transforme le résultat scoring + simulation en réponse conversationnelle (couche « génération »).
 */
export function buildChatScoringReply(scoring, sim, { amount, durationMonths }) {
  const score = scoring.score;
  const decision = scoring.decision || inferDecision(score);
  const ratio = sim.debtRatioPercent;

  let tone =
    "Voici une estimation automatique à partir des informations disponibles (complétez votre profil pour plus de précision).";

  const lines = [];
  lines.push(`${tone}`);
  lines.push(
    `Pour un financement d'environ ${amount} TND sur ${durationMonths} mois, la mensualité indicative est de ${sim.monthlyPayment.toFixed(3)} TND.`
  );
  if (ratio != null) {
    lines.push(
      `Taux d'endettement après prêt (charges + mensualité) / revenus ≈ ${ratio} % — indicateur clé en banque.`
    );
  }
  lines.push(`Score automatique : ${score}/100 (${mapDecisionFr(decision)}).`);

  if (scoring.weak_points?.length) {
    lines.push(`Points de vigilance : ${scoring.weak_points.join(" ; ")}.`);
  }
  if (scoring.recommended_actions?.length) {
    lines.push(`Pistes : ${scoring.recommended_actions.join(" ; ")}.`);
  } else if (scoring.top_factors?.length) {
    lines.push(`Facteurs pris en compte : ${scoring.top_factors.slice(0, 4).join(", ")}.`);
  }

  lines.push(scoring.justification ? `Détail : ${scoring.justification}` : "");

  return lines.filter(Boolean).join("\n\n");
}

function inferDecision(score) {
  if (score >= 80) return "ACCEPTE";
  if (score >= 50) return "A_ANALYSER";
  return "REFUS";
}

function mapDecisionFr(d) {
  if (d === "ACCEPTE") return "zone favorable (≥ 80)";
  if (d === "A_ANALYSER") return "zone à analyser (50–79)";
  return "zone défavorable (< 50)";
}
