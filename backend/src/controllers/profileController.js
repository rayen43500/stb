import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { ROLES } from "../models/User.js";
import { avatarsDir } from "../middleware/upload.js";

function trimOrUndef(v) {
  if (v == null) return undefined;
  const s = String(v).trim();
  return s || undefined;
}

export async function updateProfile(req, res, next) {
  try {
    const body = req.body || {};
    const u = req.user;
    const fields = [
      "firstName",
      "lastName",
      "phone",
      "addressLine1",
      "addressLine2",
      "city",
      "postalCode",
      "country",
      "nationalId",
    ];
    for (const key of fields) {
      if (body[key] !== undefined) u[key] = trimOrUndef(body[key]);
    }
    if (body.dateOfBirth !== undefined) {
      u.dateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth) : undefined;
    }
    const staffRoles = [ ROLES.AGENT_BANCAIRE, ROLES.CHEF_AGENCE];
    if (staffRoles.includes(req.userRole) && body.staffProfile?.agencyName !== undefined) {
      u.staffProfile = u.staffProfile || {};
      u.staffProfile.agencyName = trimOrUndef(body.staffProfile.agencyName);
      u.markModified("staffProfile");
    }
    await u.save();
    res.json({ user: u.toSafeJSON() });
  } catch (e) {
    next(e);
  }
}

export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword || String(newPassword).length < 8) {
      return res.status(400).json({
        message: "Mot de passe actuel et nouveau requis (minimum 8 caractères pour le nouveau).",
      });
    }
    const u = req.user;
    if (!(await u.comparePassword(currentPassword))) {
      return res.status(400).json({ message: "Mot de passe actuel incorrect." });
    }
    u.passwordHash = await bcrypt.hash(String(newPassword), 10);
    await u.save();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

export async function uploadMyAvatar(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ message: "Fichier image requis" });
    const u = req.user;
    const basename = req.file.filename;
    if (u.profileAvatarName) {
      const oldPath = path.join(avatarsDir, u.profileAvatarName);
      fs.unlink(oldPath, () => {});
    }
    u.profileAvatarName = basename;
    await u.save();
    res.json({ user: u.toSafeJSON() });
  } catch (e) {
    next(e);
  }
}

export async function getMyAvatar(req, res, next) {
  try {
    const name = req.user.profileAvatarName;
    if (!name) return res.status(404).end();
    const full = path.join(avatarsDir, name);
    if (!fs.existsSync(full)) return res.status(404).end();
    res.sendFile(path.resolve(full), (err) => {
      if (err && !res.headersSent) next(err);
    });
  } catch (e) {
    next(e);
  }
}

export async function deleteMyAvatar(req, res, next) {
  try {
    const u = req.user;
    if (u.profileAvatarName) {
      fs.unlink(path.join(avatarsDir, u.profileAvatarName), () => {});
      u.profileAvatarName = null;
      await u.save();
    }
    res.json({ user: u.toSafeJSON() });
  } catch (e) {
    next(e);
  }
}
