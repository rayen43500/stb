/**
 * Pseudo-NLP : extraction d'intentions et d'entités pour le chatbot (évolution : Rasa / spaCy).
 */

export function parseCreditEntities(text) {
  const raw = String(text || "").trim();
  const out = {
    amount: null,
    durationMonths: null,
    annualRatePercent: null,
    monthlyIncome: null,
    monthlyCharges: null,
  };

  const t = raw.replace(/\u00a0/g, " ");

  const kMatch = t.match(/\b(\d+)\s*k\b/i);
  if (kMatch) {
    out.amount = Number(kMatch[1]) * 1000;
  }

  const creditAmount = t.match(/(?:crédit|credit|prêt|pret|emprunt)\s*(?:de\s*)?(\d[\d\s]*)\s*(?:€|eur|euros)?/i);
  if (creditAmount && !out.amount) {
    out.amount = parseInt(creditAmount[1].replace(/\s/g, ""), 10);
  }

  if (!out.amount) {
    const euroMatch = t.match(/\b(\d[\d\s]{4,})\s*(?:€|eur|euros)\b/i);
    if (euroMatch) out.amount = parseInt(euroMatch[1].replace(/\s/g, ""), 10);
  }

  if (!out.amount) {
    const bare = t.match(/\b(\d{4,})\b/);
    if (bare) out.amount = parseInt(bare[1], 10);
  }

  const ans = t.match(/(\d+)\s*(?:an|ans)\b/i);
  if (ans) out.durationMonths = Number(ans[1]) * 12;

  const mois = t.match(/(\d+)\s*(?:mois)\b/i);
  if (mois) out.durationMonths = Number(mois[1]);

  const rate = t.match(/(\d+[.,]\d+)\s*%/);
  if (rate) out.annualRatePercent = parseFloat(rate[1].replace(",", "."));

  const rev = t.match(/(?:revenus?|salaire)\s*(?:de\s*)?(\d[\d\s]*)\s*(?:€|eur)?/i);
  if (rev) out.monthlyIncome = parseInt(rev[1].replace(/\s/g, ""), 10);

  const chg = t.match(/(?:charges)\s*(?:de\s*)?(\d[\d\s]*)\s*(?:€|eur)?/i);
  if (chg) out.monthlyCharges = parseInt(chg[1].replace(/\s/g, ""), 10);

  return out;
}

export function wantsScoringOrAcceptance(text) {
  const t = String(text || "").toLowerCase();
  return (
    /accept|accepté|accepte|refus|risque|score|scoring|endett|éligible|eligible|serai|puis-je|est-ce que|analyse/i.test(
      t
    ) || /crédit|credit|prêt|pret|emprunt|simul/i.test(t)
  );
}
