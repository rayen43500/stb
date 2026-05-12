/**
 * Assistant : pseudo-NLP + appels simulation / scoring (évolution : Rasa en amont).
 */
import { callScoringService } from "../utils/scoringClient.js";
import { runSimulation } from "../utils/simulation.js";
import { parseCreditEntities, wantsScoringOrAcceptance } from "../utils/chatNlp.js";
import { extractEntitiesWithGemini, mergeRegexAndGemini } from "../utils/geminiNlp.js";
import { buildChatScoringReply } from "../utils/chatScoringReply.js";

const link = (label, path) => ({ label, path });
const suggest = (label, query) => ({ label, query });

function staticFaqReply(t) {
  if (!t) {
    return {
      reply: "Posez-moi une question sur la simulation, les dossiers ou le scoring. Exemple : « crédit de 20000 sur 5 ans revenus 3000 ».",
      suggestions: [
        suggest("Exemple scoring", "je veux un crédit de 20000 sur 5 ans revenus 3200 charges 800"),
        suggest("Cycle dossier", "quel est le cycle du dossier"),
      ],
      links: [link("Simulateur", "/simulation"), link("Assistant (page)", "/assistant")],
    };
  }

  if (/^(bonjour|salut|hello|coucou|hey)\b/.test(t) || t.includes("bonjour")) {
    return {
      reply:
        "Bonjour. Je peux estimer risque et mensualité si vous donnez montant, durée et revenus (ex. crédit de 20000 sur 5 ans revenus 3000), ou répondre sur le parcours dossier et le scoring.",
      suggestions: [
        suggest("Test scoring", "crédit de 25000 sur 48 mois revenus 3500 charges 900"),
        suggest("Scoring théorie", "comment fonctionne le scoring"),
      ],
      links: [link("Simulation", "/simulation")],
    };
  }

  if (t.includes("simul") || t.includes("mensualit") || (t.includes("taux") && !t.includes("endett"))) {
    return {
      reply:
        "Page Simulation : montant, durée en mois ou en années, taux annuel, revenus et charges. Le chat peut aussi enchaîner simulation + scoring si vous précisez tout dans une phrase.",
      suggestions: [suggest("Scoring intégré", "crédit de 20000 sur 10 ans revenus 4000")],
      links: [link("Ouvrir le simulateur", "/simulation")],
    };
  }

  if (t.includes("dossier") || t.includes("suivi") || t.includes("statut") || t.includes("cycle")) {
    return {
      reply:
        "Cycle : BROUILLON → SOUMIS → EN_ANALYSE (scoring) → validations chef / comité si besoin → APPROUVÉ / REFUSÉ / À_MODIFIER.",
      suggestions: [suggest("Voir scoring", "mon crédit est-il risqué")],
      links: [link("Mes dossiers", "/dossiers")],
    };
  }

  if (
    (t.includes("score") || t.includes("risque") || t.includes("endett")) &&
    !/(crédit|credit|prêt|pret|\d{4,})/i.test(t)
  ) {
    return {
      reply:
        "Le scoring STB combine revenus, charges, endettement après prêt, contrat, ancienneté et incidents. Il produit un score /100 et une décision indicative : favorable (≥80), à analyser (50–79), défavorable (<50). Donnez un exemple chiffré pour un calcul.",
      suggestions: [suggest("Exemple", "je veux 15000 sur 5 ans revenus 2800")],
      links: [link("Page Assistant", "/assistant")],
    };
  }

  if (t.includes("document") || t.includes("piece") || t.includes("justificatif") || t.includes("upload")) {
    return {
      reply: "Les pièces se déposent sur la fiche dossier (liste et téléchargement sécurisés).",
      links: [link("Dossiers", "/dossiers")],
    };
  }

  if (t.includes("connexion") || t.includes("compte") || t.includes("inscription") || t.includes("mot de passe")) {
    return {
      reply: "Création de compte client puis JWT ; les rôles banque sont attribués par l’admin.",
      links: [link("Connexion", "/login"), link("Inscription", "/register")],
    };
  }

  if (t.includes("agent") || t.includes("chef") || t.includes("comité") || t.includes("comite")) {
    return {
      reply: "Les agents instruisent, le chef et le comité valident selon les statuts ; tout est tracé.",
      links: [link("Tableau de bord", "/dashboard")],
    };
  }

  return {
    reply:
      "Je n’ai pas compris. Essayez : « crédit de 20000 sur 5 ans revenus 3200 charges 800 », ou posez une question sur les dossiers.",
    suggestions: [
      suggest("Scoring", "crédit de 20000 sur 5 ans revenus 3200 charges 800"),
      suggest("Simulation", "comment simuler"),
    ],
    links: [link("Simulation", "/simulation"), link("FAQ", "/assistant")],
  };
}

function shouldRunScoringPipeline(raw, entities) {
  const hasAmount = entities.amount != null && entities.amount > 0;
  if (!hasAmount) return false;
  const creditish =
    /(?:crédit|credit|prêt|pret|emprunt|simul)/i.test(raw) ||
    wantsScoringOrAcceptance(raw) ||
    entities.durationMonths != null;
  return creditish;
}

export async function handleChatMessage(req, res, next) {
  try {
    const raw = String(req.body?.text || "").trim();
    const t = raw.toLowerCase();
    const geminiEntities = await extractEntitiesWithGemini(raw);
    const entities = mergeRegexAndGemini(parseCreditEntities(raw), geminiEntities);

    const user = req.user;
    const income =
      entities.monthlyIncome ?? user?.clientProfile?.monthlyIncome ?? null;
    const charges = entities.monthlyCharges ?? user?.clientProfile?.monthlyCharges ?? 0;
    const contract = user?.clientProfile?.contractType ?? "CDI";
    const seniority = user?.clientProfile?.seniorityMonths ?? 24;
    const defaults = user?.clientProfile?.priorDefaults ?? 0;
    const incidents = user?.clientProfile?.bankingIncidents ?? 0;

    const months = entities.durationMonths ?? 48;
    const rate = entities.annualRatePercent ?? 5.5;

    if (shouldRunScoringPipeline(raw, entities)) {
      if (!income || income <= 0) {
        return res.json({
          reply:
            "Pour calculer le risque comme en banque, indiquez vos revenus mensuels nets dans le message (ex. « … revenus 3000 charges 800 ») ou connectez-vous avec un profil client complété.",
          suggestions: [
            suggest(
              "Exemple complet",
              `crédit de ${entities.amount} sur ${Math.round(months / 12)} ans revenus 3200 charges 900`
            ),
          ],
          links: [link("Simulation", "/simulation"), link("Connexion", "/login")],
        });
      }

      const sim = runSimulation({
        amount: entities.amount,
        durationMonths: months,
        annualRatePercent: rate,
        monthlyIncome: income,
        monthlyCharges: charges,
      });

      const scoringPayload = {
        monthly_income: income,
        monthly_charges: charges,
        debt_ratio_percent: sim.debtRatioPercent,
        contract_type: contract,
        seniority_months: seniority,
        prior_defaults: defaults,
        banking_incidents: incidents,
      };

      const scoring = await callScoringService(scoringPayload);
      const reply = buildChatScoringReply(scoring, sim, {
        amount: entities.amount,
        durationMonths: months,
      });

      return res.json({
        reply,
        meta: {
          scoring: {
            score: scoring.score,
            decision: scoring.decision,
            category: scoring.category,
            weak_points: scoring.weak_points || scoring.weakPoints,
            recommended_actions: scoring.recommended_actions || scoring.recommendedActions,
          },
          simulation: {
            monthlyPayment: sim.monthlyPayment,
            debtRatioPercent: sim.debtRatioPercent,
            simulationRiskLabel: sim.simulationRiskLabel,
          },
        },
        suggestions: [
          suggest("Autre scénario", "crédit de 15000 sur 10 ans revenus 2800 charges 700"),
          suggest("Cycle dossier", "cycle du dossier"),
        ],
        links: [link("Simulateur détaillé", "/simulation"), link("Dossiers", "/dossiers")],
      });
    }

    if (wantsScoringOrAcceptance(raw) && !(entities.amount > 0)) {
      return res.json({
        reply:
          "Pour savoir si un profil est « acceptable » automatiquement, donnez au moins un montant et vos revenus (durée en années ou mois). Exemple : « est-ce que mon crédit de 20000 sur 5 ans passe si je gagne 3000 ? »",
        suggestions: [suggest("Exemple", "crédit de 20000 sur 5 ans revenus 3000 charges 800")],
        links: [link("Simulation", "/simulation")],
      });
    }

    return res.json(staticFaqReply(t));
  } catch (e) {
    next(e);
  }
}
