import nodemailer from "nodemailer";

let transporter;

function smtpTlsOptions() {
  if (process.env.SMTP_TLS_INSECURE === "true") {
    return { rejectUnauthorized: false };
  }
  return undefined;
}

function getTransport() {
  if (!process.env.SMTP_HOST) return null;
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!user || !pass) {
    console.warn("[email] SMTP_HOST défini mais SMTP_USER/SMTP_PASS manquants — emails désactivés");
    return null;
  }
  if (!transporter) {
    const tls = smtpTlsOptions();
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: { user, pass },
      ...(tls ? { tls } : {}),
    });
  }
  return transporter;
}

export async function sendOptionalEmail({ to, subject, text, html }) {
  const t = getTransport();
  if (!t || !to) {
    if (subject) {
      console.log(`[email stub] to=${to} subject=${subject}`);
      if (text) console.log(text);
    }
    return false;
  }
  try {
    await t.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@stb.local",
      to,
      subject,
      text,
      html: html || undefined,
    });
    return true;
  } catch (err) {
    console.error("[email] échec envoi:", err.message);
    if (process.env.SMTP_TLS_INSECURE !== "true" && /certificate|TLS|SSL/i.test(String(err.message))) {
      console.error(
        "[email] Astuce : ajoutez SMTP_TLS_INSECURE=true dans backend/.env (réseau d'entreprise / certificat auto-signé)"
      );
    }
    return false;
  }
}

export function frontendBaseUrl() {
  return (process.env.FRONTEND_URL || "http://127.0.0.1:5173").replace(/\/$/, "");
}
