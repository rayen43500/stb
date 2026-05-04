import Notification from "../models/Notification.js";

export async function listMine(req, res, next) {
  try {
    const items = await Notification.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(100).lean();
    res.json(items);
  } catch (e) {
    next(e);
  }
}

export async function markRead(req, res, next) {
  try {
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { read: true },
      { new: true }
    );
    if (!n) return res.status(404).json({ message: "Notification introuvable" });
    res.json(n);
  } catch (e) {
    next(e);
  }
}
