import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export const ROLES = {
  CLIENT: "CLIENT",
  AGENT_BANCAIRE: "AGENT_BANCAIRE",
  CHEF_AGENCE: "CHEF_AGENCE",
  COMITE_CREDIT: "COMITE_CREDIT",
  ADMIN: "ADMIN",
};

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.CLIENT,
    },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    phone: { type: String, trim: true },
    addressLine1: { type: String, trim: true },
    addressLine2: { type: String, trim: true },
    city: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    country: { type: String, trim: true, default: "Tunisie" },
    profileAvatarName: { type: String, trim: true },
    /** CIN / pièce d'identité — renseigné par le client sur son profil */
    nationalId: { type: String, trim: true },
    /** Agence, direction — pour les profils banque */
    staffProfile: {
      agencyName: { type: String, trim: true },
    },
    clientProfile: {
      monthlyIncome: Number,
      monthlyCharges: Number,
      contractType: { type: String, enum: ["CDI", "CDD", "INDEPENDANT"] },
      seniorityMonths: { type: Number, default: 0 },
      priorDefaults: { type: Number, default: 0 },
      bankingIncidents: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    email: this.email,
    role: this.role,
    firstName: this.firstName,
    lastName: this.lastName,
    phone: this.phone,
    addressLine1: this.addressLine1,
    addressLine2: this.addressLine2,
    city: this.city,
    postalCode: this.postalCode,
    country: this.country || "Tunisie",
    nationalId: this.nationalId,
    staffProfile:
      this.staffProfile && this.staffProfile.agencyName
        ? { agencyName: this.staffProfile.agencyName }
        : undefined,
    hasAvatar: Boolean(this.profileAvatarName),
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : undefined,
    clientProfile: this.clientProfile || undefined,
  };
};

export default mongoose.model("User", userSchema);
