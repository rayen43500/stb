import User, { ROLES } from "../models/User.js";

export async function listUsers(req, res, next) {
  try {
    const users = await User.find().select("-passwordHash").sort({ createdAt: -1 }).lean();
    res.json(users);
  } catch (e) {
    next(e);
  }
}

export async function updateUserRole(req, res, next) {
  try {
    const { role } = req.body;
    if (!Object.values(ROLES).includes(role)) {
      return res.status(400).json({ message: "Rôle invalide" });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });
    user.role = role;
    await user.save();
    res.json({ user: user.toSafeJSON() });
  } catch (e) {
    next(e);
  }
}
