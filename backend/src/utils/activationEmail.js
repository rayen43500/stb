import { frontendBaseUrl, sendOptionalEmail } from "./mail.js";

export function buildActivationLink(email, code) {
  const base = frontendBaseUrl();
  const params = new URLSearchParams({
    email: email.toLowerCase().trim(),
    code: String(code).trim(),
  });
  return `${base}/activate?${params.toString()}`;
}

export async function sendClientActivationEmail(user, code, { reason = "registration" } = {}) {
  const link = buildActivationLink(user.email, code);
  const name = user.firstName || "Client";
  const intro =
    reason === "resend"
      ? "Vous avez demandé un nouvel email de vérification."
      : "Merci pour votre inscription sur STB Crédits.";

  const text = `${intro}

Bonjour ${name},

Pour activer votre compte et définir votre mot de passe, ouvrez ce lien :
${link}

Code de secours (si le lien ne fonctionne pas) : ${code}
Ce lien expire dans 48 heures.

Cordialement,
STB Bank — Portail Crédits`;

  const html = `
<p>${intro}</p>
<p>Bonjour <strong>${name}</strong>,</p>
<p>Cliquez sur le bouton ci-dessous pour vérifier votre compte et choisir votre mot de passe :</p>
<p style="margin:24px 0">
  <a href="${link}" style="background:#1D4ED8;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
    Activer mon compte STB
  </a>
</p>
<p style="font-size:13px;color:#64748B">Ou copiez ce lien :<br><a href="${link}">${link}</a></p>
<p style="font-size:13px;color:#64748B">Code de secours : <strong>${code}</strong> (valable 48 h)</p>
<p>Cordialement,<br>STB Bank — Portail Crédits</p>`;

  return sendOptionalEmail({
    to: user.email,
    subject: "STB Crédits — Vérifiez votre compte",
    text,
    html,
  });
}
