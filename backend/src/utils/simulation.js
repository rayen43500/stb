/**
 * Mensualité crédit à taux fixe (amortissement type prêt classique).
 * @param {number} principal - capital emprunté
 * @param {number} annualRatePercent - taux annuel en %
 * @param {number} durationMonths - durée en mois
 */
export function computeMonthlyPayment(principal, annualRatePercent, durationMonths) {
  const n = Math.max(1, durationMonths);
  const r = annualRatePercent / 100 / 12;
  if (r === 0) return principal / n;
  const factor = (1 + r) ** n;
  return (principal * r * factor) / (factor - 1);
}

export function computeTotalCost(monthlyPayment, durationMonths, principal) {
  return Math.round(monthlyPayment * durationMonths * 100) / 100 - principal;
}

/**
 * Taux d'endettement après prêt : (charges + mensualité) / revenus * 100
 */
export function computeDebtRatioPercent(monthlyIncome, monthlyCharges, monthlyPayment) {
  if (!monthlyIncome || monthlyIncome <= 0) return null;
  return Math.round(((monthlyCharges + monthlyPayment) / monthlyIncome) * 10000) / 100;
}

export function riskFromDebtRatio(ratio) {
  if (ratio == null) return { label: "MODERE", recommendations: ["Compléter les revenus pour affiner le risque."] };
  if (ratio <= 33) return { label: "ACCEPTABLE", recommendations: [] };
  if (ratio <= 40) {
    return {
      label: "MODERE",
      recommendations: ["Envisager une durée plus longue pour réduire la mensualité.", "Augmenter l'apport pour diminuer le capital."],
    };
  }
  return {
    label: "ELEVE",
    recommendations: [
      "Réduire le montant demandé.",
      "Allonger la durée ou proposer un apport personnel.",
      "Vérifier la stabilité des revenus.",
    ],
  };
}

export function runSimulation({ amount, durationMonths, annualRatePercent, monthlyIncome, monthlyCharges }) {
  const monthlyPayment = Math.round(computeMonthlyPayment(amount, annualRatePercent, durationMonths) * 100) / 100;
  const interestTotal = Math.round(computeTotalCost(monthlyPayment, durationMonths, amount) * 100) / 100;
  const totalRepaid = Math.round(amount + interestTotal);
  const debtRatioPercent = computeDebtRatioPercent(monthlyIncome, monthlyCharges || 0, monthlyPayment);
  const { label, recommendations } = riskFromDebtRatio(debtRatioPercent);
  return {
    monthlyPayment,
    totalCostInterest: interestTotal,
    totalRepaid,
    debtRatioPercent,
    simulationRiskLabel: label,
    recommendations,
  };
}
