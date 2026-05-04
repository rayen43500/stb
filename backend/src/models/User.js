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
    clientProfile: this.clientProfile || undefined,
  };
};

export default mongoose.model("User", userSchema);
