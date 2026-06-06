import { frontendBaseUrl, sendOptionalEmail } from "./mail.js";
import { renderStbEmail } from "./emailTemplate.js";

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
      : "Merci pour votre inscription sur le portail STB Crédits.";

  const text = `${intro}

Bonjour ${name},

Pour activer votre compte et définir votre mot de passe, ouvrez ce lien :
${link}

Code de secours (si le lien ne fonctionne pas) : ${code}
Ce lien expire dans 48 heures.

Cordialement,
STB Bank — Portail Crédits`;

  const { html, attachments } = renderStbEmail({
    title: "Vérifiez votre compte",
    greeting: `Bonjour ${name}`,
    paragraphs: [
      intro,
      "Cliquez sur le bouton ci-dessous pour activer votre compte et choisir votre mot de passe.",
      "Si le bouton ne fonctionne pas, utilisez le code de secours sur la page d'activation.",
    ],
    ctaHref: link,
    ctaLabel: "Activer mon compte STB",
    code,
  });

  return sendOptionalEmail({
    to: user.email,
    subject: "STB Crédits — Vérifiez votre compte",
    text,
    html,
    attachments,
  });
}
