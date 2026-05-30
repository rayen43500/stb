"""
Service STB Scoring + NLP.
- /score: règles explicables.
- /nlp/parse: extraction d'entités crédit (fallback regex, option LLM via API key).
"""
from __future__ import annotations

import json
import os
import re
import urllib.error
import urllib.request
from typing import Literal, Tuple

from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(title="STB Scoring", version="0.2.0")


class ScoreRequest(BaseModel):
    monthly_income: float | None = None
    monthly_charges: float = 0
    debt_ratio_percent: float | None = None
    contract_type: str | None = None
    seniority_months: int = 0
    prior_defaults: int = 0
    banking_incidents: int = 0


Decision = Literal["ACCEPTE", "A_ANALYSER", "REFUS"]


class ScoreResponse(BaseModel):
    score: int = Field(ge=0, le=100)
    category: str
    decision: Decision
    decision_label_fr: str
    top_factors: list[str]
    weak_points: list[str]
    recommended_actions: list[str]
    justification: str


class NlpParseRequest(BaseModel):
    text: str = ""


class NlpParseResponse(BaseModel):
    amount: float | None = None
    durationMonths: int | None = None
    annualRatePercent: float | None = None
    monthlyIncome: float | None = None
    monthlyCharges: float | None = None
    intent: str | None = None
    confidence: float = 0.0
    source: str = "regex"


def _decision_from_score(score: int) -> Tuple[Decision, str]:
    if score >= 80:
        return "ACCEPTE", "Profil globalement favorable (score ≥ 80)."
    if score >= 50:
        return "A_ANALYSER", "Profil à approfondir manuellement (score entre 50 et 79)."
    return "REFUS", "Risque élevé au vu des critères automatisés (score < 50)."


def _category_from_score(score: int) -> str:
    if score >= 65:
        return "FAIBLE"
    if score >= 40:
        return "MOYEN"
    return "ELEVE"


def compute_score(p: ScoreRequest) -> ScoreResponse:
    """Points de départ + bonus / malus — logique métier lisible pour le jury."""
    score = 58
    factors: list[str] = []
    weak: list[str] = []
    actions: list[str] = []

    inc = p.monthly_income or 0
    if inc >= 4000:
        score += 14
        factors.append("Revenus élevés")
    elif inc >= 2800:
        score += 10
        factors.append("Revenus confortables")
    elif inc >= 1800:
        score += 5
        factors.append("Revenus corrects")
    elif inc > 0 and inc < 1500:
        score -= 8
        weak.append("Revenus modestes")
        actions.append("Vérifier la stabilité des revenus ou un co-emprunteur.")

    r = p.debt_ratio_percent
    if r is not None:
        if r <= 30:
            score += 18
            factors.append("Endettement maîtrisé")
        elif r <= 33:
            score += 10
            factors.append("Endettement dans les usages courants")
        elif r <= 40:
            score -= 6
            factors.append("Endettement modéré")
            actions.append("Envisager allonger la durée ou réduire le montant.")
        else:
            score -= 28
            weak.append("Taux d'endettement élevé après prêt")
            actions.append("Réduire le montant demandé ou l'apport ; rééchelonner la durée.")

    ct = (p.contract_type or "").upper()
    if ct == "CDI":
        score += 12
        factors.append("Contrat CDI")
    elif ct == "CDD":
        score -= 10
        weak.append("Contrat CDD")
        actions.append("Privilégier une durée de prêt alignée sur le terme du CDD.")
    elif ct == "INDEPENDANT":
        score -= 4
        factors.append("Profil indépendant")
    elif ct == "FONCTIONNAIRE":
        score += 10
        factors.append("Fonctionnaire — stabilité de l'emploi")
    elif ct == "AUTRE":
        score -= 2
        factors.append("Type de contrat atypique")

    if p.seniority_months >= 36:
        score += 8
        factors.append("Ancienneté solide")
    elif p.seniority_months >= 12:
        score += 4
    else:
        score -= 8
        weak.append("Faible ancienneté")
        actions.append("Consolider la stabilité professionnelle avant accord.")

    if p.prior_defaults > 0:
        score -= 22
        weak.append("Incidents de remboursement antérieurs")
        actions.append("Analyser le contexte des incidents et file active.")

    if p.banking_incidents > 0:
        score -= 12
        weak.append("Incidents bancaires")
        actions.append("Contrôler les motifs d'incidents de paiement.")

    score = max(0, min(100, score))

    decision, decision_fr = _decision_from_score(score)
    category = _category_from_score(score)

    justification = (
        f"Score {score}/100 — décision automatique : {decision} ({decision_fr}) "
        f"— endettement après prêt : {r if r is not None else 'N/A'} %, "
        f"contrat {ct or 'N/A'}, ancienneté {p.seniority_months} mois."
    )

    return ScoreResponse(
        score=score,
        category=category,
        decision=decision,
        decision_label_fr=decision_fr,
        top_factors=factors[:6],
        weak_points=weak,
        recommended_actions=actions[:4],
        justification=justification,
    )


@app.get("/health")
def health():
    return {"ok": True, "service": "STB Scoring"}


@app.post("/score", response_model=ScoreResponse)
def score(req: ScoreRequest):
    return compute_score(req)


def _parse_regex(text: str) -> NlpParseResponse:
    t = (text or "").replace("\xa0", " ")
    out = NlpParseResponse(source="regex", confidence=0.55)
    amount = re.search(
        r"(?:crédit|credit|prêt|pret|emprunt)\s*(?:de\s*)?(\d[\d\s]*)\s*(?:€|eur|euros|tnd|dt|dinars?)?",
        t,
        re.I,
    )
    if amount:
        out.amount = float(amount.group(1).replace(" ", ""))
    years = re.search(r"(\d+)\s*(?:an|ans)\b", t, re.I)
    months = re.search(r"(\d+)\s*mois\b", t, re.I)
    if years:
        out.durationMonths = int(years.group(1)) * 12
    if months:
        out.durationMonths = int(months.group(1))
    rate = re.search(r"(\d+[.,]\d+)\s*%", t)
    if rate:
        out.annualRatePercent = float(rate.group(1).replace(",", "."))
    rev = re.search(r"(?:revenus?|salaire)\s*(?:de\s*)?(\d[\d\s]*)", t, re.I)
    chg = re.search(r"charges?\s*(?:de\s*)?(\d[\d\s]*)", t, re.I)
    if rev:
        out.monthlyIncome = float(rev.group(1).replace(" ", ""))
    if chg:
        out.monthlyCharges = float(chg.group(1).replace(" ", ""))
    if re.search(r"\b(score|risque|accepte|refus)\b", t, re.I):
        out.intent = "SCORING"
    elif re.search(r"\b(simul|mensualit|taux)\b", t, re.I):
        out.intent = "SIMULATION"
    else:
        out.intent = "FAQ"
    return out


def _parse_llm(text: str) -> NlpParseResponse | None:
    api_key = os.getenv("OPENAI_API_KEY")
    model = os.getenv("NLP_MODEL", "gpt-4o-mini")
    if not api_key:
        return None
    schema = {
        "type": "json_schema",
        "json_schema": {
            "name": "credit_entities",
            "schema": {
                "type": "object",
                "properties": {
                    "amount": {"type": ["number", "null"]},
                    "durationMonths": {"type": ["integer", "null"]},
                    "annualRatePercent": {"type": ["number", "null"]},
                    "monthlyIncome": {"type": ["number", "null"]},
                    "monthlyCharges": {"type": ["number", "null"]},
                    "intent": {"type": ["string", "null"]},
                    "confidence": {"type": ["number", "null"]},
                },
                "required": [
                    "amount",
                    "durationMonths",
                    "annualRatePercent",
                    "monthlyIncome",
                    "monthlyCharges",
                    "intent",
                    "confidence",
                ],
                "additionalProperties": False,
            },
            "strict": True,
        },
    }
    payload = {
        "model": model,
        "temperature": 0,
        "messages": [
            {
                "role": "system",
                "content": (
                    "Tu extrais des entités de demande de crédit en français tunisien. "
                    "durationMonths doit être en mois."
                ),
            },
            {"role": "user", "content": text},
        ],
        "response_format": schema,
    }
    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            body = json.loads(resp.read().decode("utf-8"))
        content = body["choices"][0]["message"]["content"]
        parsed = json.loads(content)
        return NlpParseResponse(
            amount=parsed.get("amount"),
            durationMonths=parsed.get("durationMonths"),
            annualRatePercent=parsed.get("annualRatePercent"),
            monthlyIncome=parsed.get("monthlyIncome"),
            monthlyCharges=parsed.get("monthlyCharges"),
            intent=parsed.get("intent"),
            confidence=float(parsed.get("confidence") or 0.7),
            source="llm",
        )
    except (urllib.error.URLError, KeyError, ValueError, TypeError):
        return None


@app.post("/nlp/parse", response_model=NlpParseResponse)
def nlp_parse(req: NlpParseRequest):
    llm = _parse_llm(req.text)
    if llm:
        return llm
    return _parse_regex(req.text)
