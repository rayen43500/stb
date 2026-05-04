import nodemailer from "nodemailer";

let transporter;

function getTransport() {
  if (!process.env.SMTP_HOST) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
    });
  }
  return transporter;
}

export async function sendOptionalEmail({ to, subject, text }) {
  const t = getTransport();
  if (!t || !to) {
    if (subject) console.log(`[email stub] to=${to} subject=${subject}`);
    return;
  }
  await t.sendMail({
    from: process.env.SMTP_FROM || "noreply@stb.local",
    to,
    subject,
    text,
  });
}
