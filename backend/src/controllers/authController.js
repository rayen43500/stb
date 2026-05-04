import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User, { ROLES } from "../models/User.js";

function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

export async function register(req, res, next) {
  try {
    const { email, password, firstName, lastName, phone, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email et mot de passe requis" });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: "Email déjà utilisé" });

    let finalRole = ROLES.CLIENT;
    if (role && req.user?.role === ROLES.ADMIN && Object.values(ROLES).includes(role)) {
      finalRole = role;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      passwordHash,
      role: finalRole,
      firstName,
      lastName,
      phone,
    });
    const token = signToken(user);
    res.status(201).json({ token, user: user.toSafeJSON() });
  } catch (e) {
    next(e);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase()?.trim() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Identifiants invalides" });
    }
    const token = signToken(user);
    res.json({ token, user: user.toSafeJSON() });
  } catch (e) {
    next(e);
  }
}

export async function me(req, res) {
  res.json({ user: req.user.toSafeJSON() });
}
