import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User, { ROLES } from "./models/User.js";

const demoUsers = [
  {
    email: process.env.SEED_ADMIN_EMAIL || "admin@stb.local",
    password: process.env.SEED_ADMIN_PASSWORD || "AdminSTB!2026",
    role: ROLES.ADMIN,
    firstName: "Admin",
    lastName: "STB",
  },
  {
    email: "admin.test.2026@stb.local",
    password: "AdminTest!8nQ4",
    role: ROLES.ADMIN,
    firstName: "Test",
    lastName: "Admin",
  },
  {
    email: "client@stb.local",
    password: "ClientSTB!2026",
    role: ROLES.CLIENT,
    firstName: "Demo",
    lastName: "Client",
    clientProfile: {
      monthlyIncome: 3500,
      monthlyCharges: 900,
      contractType: "CDI",
      seniorityMonths: 36,
      priorDefaults: 0,
      bankingIncidents: 0,
    },
  },
  {
    email: "agent@stb.local",
    password: "AgentSTB!2026",
    role: ROLES.AGENT_BANCAIRE,
    firstName: "Agent",
    lastName: "Démo",
  },
  {
    email: "chef@stb.local",
    password: "ChefSTB!2026",
    role: ROLES.CHEF_AGENCE,
    firstName: "Chef",
    lastName: "Agence",
  },
  {
    email: "comite@stb.local",
    password: "ComiteSTB!2026",
    role: ROLES.COMITE_CREDIT,
    firstName: "Membre",
    lastName: "Comité",
  },
];

async function run() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/stb_credit";
  await mongoose.connect(uri);

  for (const u of demoUsers) {
    const exists = await User.findOne({ email: u.email });
    if (exists) continue;
    const passwordHash = await bcrypt.hash(u.password, 10);
    await User.create({
      email: u.email,
      passwordHash,
      role: u.role,
      firstName: u.firstName,
      lastName: u.lastName,
      clientProfile: u.clientProfile,
    });
    console.log("Créé:", u.email, u.role);
  }

  console.log("Seed terminé. Comptes : admin@stb.local, admin.test.2026@stb.local, client@stb.local, agent@stb.local, chef@stb.local, comite@stb.local");
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
