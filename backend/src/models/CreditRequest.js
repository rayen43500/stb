import mongoose from "mongoose";

export const CREDIT_TYPES = ["CONSO", "IMMOBILIER", "VEHICULE", "AUTRE"];

export const CREDIT_STATUSES = [
  "BROUILLON",
  "SOUMIS",
  "EN_ANALYSE",
  "EN_VALIDATION_CHEF",
  "EN_VALIDATION_COMITE",
  "APPROUVÉ",
  "REFUSÉ",
  "À_MODIFIER",
];

const commentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, required: true },
    text: { type: String, required: true },
    action: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const creditRequestSchema = new mongoose.Schema(
  {
    applicantId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    durationMonths: { type: Number, required: true },
    annualRatePercent: { type: Number, required: true },
    monthlyPayment: Number,
    totalCost: Number,
    debtRatioPercent: Number,
    simulationRiskLabel: { type: String, enum: ["ACCEPTABLE", "MODERE", "ELEVE"] },
    recommendations: [String],
    creditType: { type: String, enum: CREDIT_TYPES, default: "CONSO" },
    /** Contrôle pièces par l'agent */
    documentVerification: {
      cin: { type: Boolean, default: false },
      payslip: { type: Boolean, default: false },
      contract: { type: Boolean, default: false },
      bankStatement: { type: Boolean, default: false },
    },
    status: { type: String, enum: CREDIT_STATUSES, default: "BROUILLON" },
    scoring: {
      score: Number,
      category: { type: String, enum: ["FAIBLE", "MOYEN", "ELEVE"] },
      decision: { type: String, enum: ["ACCEPTE", "A_ANALYSER", "REFUS"] },
      decisionLabelFr: String,
      topFactors: [String],
      weakPoints: [String],
      recommendedActions: [String],
      justification: String,
    },
    comments: [commentSchema],
  },
  { timestamps: true }
);

export default mongoose.model("CreditRequest", creditRequestSchema);
