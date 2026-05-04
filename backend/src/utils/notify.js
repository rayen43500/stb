import Notification from "../models/Notification.js";
import User from "../models/User.js";
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
