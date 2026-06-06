import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.join(__dirname, "../../assets/stb-logo.png");
const LOGO_CID = "stb-logo@stb.local";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/'/g, "&#39;")
    .replace(/"/g, "&quot;");
}

export function logoAttachment() {
  if (!fs.existsSync(LOGO_PATH)) return null;
  return {
    filename: "stb-logo.png",
    path: LOGO_PATH,
    cid: LOGO_CID,
  };
}

/**
 * Gabarit HTML email STB (compatible clients mail).
 */
export function renderStbEmail({
  title,
  greeting,
  paragraphs = [],
  ctaHref,
  ctaLabel,
  code,
  codeLabel = "Code de secours",
  footerLines = ["STB Bank — Société Tunisienne de Banque", "Portail Crédits en ligne"],
}) {
  const logo = logoAttachment();
  const logoBlock = logo
    ? `<img src="cid:${LOGO_CID}" alt="STB Bank" width="160" style="display:block;max-width:160px;height:auto;margin:0 auto" />`
    : `<p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.04em">STB BANK</p>`;

  const bodyParagraphs = paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#334155">${escapeHtml(p)}</p>`
    )
    .join("");

  const ctaBlock =
    ctaHref && ctaLabel
      ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto">
  <tr>
    <td style="border-radius:10px;background:#1D4ED8">
      <a href="${escapeHtml(ctaHref)}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none">
        ${escapeHtml(ctaLabel)}
      </a>
    </td>
  </tr>
</table>
<p style="margin:0 0 8px;font-size:12px;color:#94A3B8;text-align:center">Ou copiez ce lien :</p>
<p style="margin:0 0 20px;font-size:12px;word-break:break-all;text-align:center">
  <a href="${escapeHtml(ctaHref)}" style="color:#1D4ED8">${escapeHtml(ctaHref)}</a>
</p>`
      : "";

  const codeBlock = code
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px">
  <tr>
    <td style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:16px;text-align:center">
      <p style="margin:0 0 6px;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#64748B">${escapeHtml(codeLabel)}</p>
      <p style="margin:0;font-size:28px;font-weight:700;letter-spacing:0.2em;color:#0F172A;font-family:Consolas,Monaco,monospace">${escapeHtml(code)}</p>
      <p style="margin:8px 0 0;font-size:12px;color:#94A3B8">Valable 48 heures</p>
    </td>
  </tr>
</table>`
    : "";

  const footer = footerLines
    .map((line) => `<p style="margin:0 0 4px;font-size:12px;color:#94A3B8">${escapeHtml(line)}</p>`)
    .join("");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#EFF6FF;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EFF6FF;padding:32px 16px">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;border:1px solid #DBEAFE;overflow:hidden;box-shadow:0 8px 32px rgba(15,23,42,0.08)">
          <tr>
            <td style="background:linear-gradient(135deg,#0A2463 0%,#1D4ED8 100%);padding:28px 24px;text-align:center">
              ${logoBlock}
            </td>
          </tr>
          <tr>
            <td style="padding:32px 28px 12px">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0F172A;text-align:center">${escapeHtml(title)}</h1>
              ${greeting ? `<p style="margin:0 0 20px;font-size:15px;color:#64748B;text-align:center">${escapeHtml(greeting)}</p>` : ""}
              ${bodyParagraphs}
              ${ctaBlock}
              ${codeBlock}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 28px;border-top:1px solid #F1F5F9;text-align:center">
              ${footer}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { html, attachments: logo ? [logo] : [] };
}
