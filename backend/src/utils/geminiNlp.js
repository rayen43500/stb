/**
 * Extraction d'entités via Gemini (gemini-2.5-flash) lorsque GEMINI_API_KEY est défini.
 * Retourne null si clé absente ou erreur — le chat retombe sur parseCreditEntities (regex).
 */
import { GoogleGenerativeAI } from "@google/generative-ai";

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function stripJsonFence(text) {
  let s = String(text || "").trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/im.exec(s);
  if (fence) s = fence[1].trim();
  return s;
}

export async function extractEntitiesWithGemini(rawText) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const input = String(rawText || "").trim().slice(0, 8000);
  if (!input) return null;

  const prompt = `Tu extrais des données structurées pour un assistant bancaire (crédits en Tunisie, montants en TND).

Réponds UNIQUEMENT par un objet JSON valide, sans texte avant ou après, sans markdown :
{
  "amount": number ou null,
  "durationMonths": number ou null,
  "annualRatePercent": number ou null,
  "monthlyIncome": number ou null,
  "monthlyCharges": number ou null,
  "intent": "credit_scoring" | "faq" | "other"
}

Règles :
- Si l'utilisateur parle d'un crédit/prêt/simulation avec des chiffres, intent = "credit_scoring".
- Si question générale (dossier, connexion, documents sans montant), intent = "faq".
- Durée : si années ("5 ans"), durationMonths = années * 12.
- Montants entiers en TND.

Message utilisateur :
${input}`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 512,
      },
    });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonStr = stripJsonFence(text);
    const parsed = JSON.parse(jsonStr);

    return {
      amount: parsed.amount != null ? Number(parsed.amount) : null,
      durationMonths: parsed.durationMonths != null ? Number(parsed.durationMonths) : null,
      annualRatePercent: parsed.annualRatePercent != null ? Number(parsed.annualRatePercent) : null,
      monthlyIncome: parsed.monthlyIncome != null ? Number(parsed.monthlyIncome) : null,
      monthlyCharges: parsed.monthlyCharges != null ? Number(parsed.monthlyCharges) : null,
      intent: ["credit_scoring", "faq", "other"].includes(parsed.intent) ? parsed.intent : "other",
    };
  } catch (e) {
    console.warn("[Gemini NLP]", e.message);
    return null;
  }
}

export function mergeRegexAndGemini(regexEntities, gemini) {
  const out = { ...regexEntities };
  if (!gemini) return out;
  const keys = ["amount", "durationMonths", "annualRatePercent", "monthlyIncome", "monthlyCharges"];
  for (const k of keys) {
    const v = gemini[k];
    if (v != null && typeof v === "number" && !Number.isNaN(v)) {
      out[k] = v;
    }
  }
  return out;
}
