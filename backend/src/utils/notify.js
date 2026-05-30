import Notification from "../models/Notification.js";
import User, { ROLES } from "../models/User.js";
import { sendOptionalEmail } from "./mail.js";

export async function notifyCreditEvent(applicantId, { type, title, message, link, sendEmail = true }) {
  await Notification.create({
    userId: applicantId,
    type,
    title,
    message,
    link,
  });
  if (sendEmail) {
    const user = await User.findById(applicantId);
    if (user?.email) {
      await sendOptionalEmail({ to: user.email, subject: title, text: message });
    }
  }
}

export async function notifyStaffByRole(role, { type, title, message, link, sendEmail = false }) {
  const staff = await User.find({ role, accountStatus: { $ne: "REJECTED" } }).select("_id email");
  for (const u of staff) {
    await Notification.create({
      userId: u._id,
      type,
      title,
      message,
      link,
    });
    if (sendEmail && u.email) {
      await sendOptionalEmail({ to: u.email, subject: title, text: message });
    }
  }
}

export async function notifyUser(userId, payload) {
  await Notification.create({
    userId,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    link: payload.link,
  });
  if (payload.sendEmail) {
    const user = await User.findById(userId);
    if (user?.email) {
      await sendOptionalEmail({
        to: user.email,
        subject: payload.title,
        text: payload.message,
      });
    }
  }
}
