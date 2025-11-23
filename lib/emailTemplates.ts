"use server";

type ConfirmEmailParams = {
  confirmUrl: string;
  productName?: string;
};

type WelcomeEmailParams = {
  vision: string;
  screenshots: string[];
  roadmap: { title: string; eta?: string; description?: string }[];
  ctaUrl?: string;
  productName?: string;
};

export function confirmEmailTemplate({ confirmUrl, productName = "SkinCompass" }: ConfirmEmailParams) {
  return `
    <div style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; color: #0f172a; background: #f8fafc; padding: 32px;">
      <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 28px;">
        <p style="font-size: 14px; letter-spacing: 0.08em; text-transform: uppercase; color: #818cf8; margin: 0 0 12px;">Early Access</p>
        <h1 style="margin: 0 0 12px; font-size: 24px; line-height: 1.3;">Bestätige deine E-Mail für ${productName}</h1>
        <p style="margin: 0 0 18px; font-size: 15px; color: #334155;">
          Bitte bestätige deine Anmeldung, damit wir dir Updates zum Launch schicken können.
        </p>
        <a href="${confirmUrl}" style="display: inline-block; background: #111827; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 12px; font-weight: 600;">
          Anmeldung bestätigen
        </a>
        <p style="margin: 16px 0 0; font-size: 13px; color: #64748b;">
          Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:
          <br /><span style="word-break: break-all;">${confirmUrl}</span>
        </p>
      </div>
      <p style="text-align: center; margin-top: 16px; font-size: 12px; color: #94a3b8;">
        Du hast dich nicht angemeldet? Ignoriere diese E-Mail.
      </p>
    </div>
  `;
}

export function welcomeEmailTemplate({
  vision,
  screenshots,
  roadmap,
  ctaUrl,
  productName = "SkinCompass",
}: WelcomeEmailParams) {
  const screenshotsHtml =
    screenshots.length === 0
      ? ""
      : `
        <div style="margin-top: 20px;">
          <p style="font-size: 14px; color: #334155; margin: 0 0 8px;">Ein Blick in das UI:</p>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px;">
            ${screenshots
              .map(
                (url) => `
                  <div style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #0b1224;">
                    <img src="${url}" alt="${productName} Screenshot" style="width: 100%; height: auto; display: block;" />
                  </div>
                `,
              )
              .join("")}
          </div>
        </div>
      `;

  const roadmapHtml =
    roadmap.length === 0
      ? ""
      : `
        <div style="margin-top: 24px;">
          <p style="font-size: 14px; color: #334155; margin: 0 0 8px;">Roadmap (aktuell):</p>
          <ul style="list-style: none; padding: 0; margin: 0;">
            ${roadmap
              .map(
                (item) => `
                  <li style="padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 10px; background: #fff;">
                    <div style="display: flex; justify-content: space-between; align-items: baseline; gap: 8px;">
                      <span style="font-weight: 600; color: #111827;">${item.title}</span>
                      ${item.eta ? `<span style="font-size: 12px; color: #64748b;">${item.eta}</span>` : ""}
                    </div>
                    ${item.description ? `<p style="margin: 6px 0 0; font-size: 13px; color: #475569;">${item.description}</p>` : ""}
                  </li>
                `,
              )
              .join("")}
          </ul>
        </div>
      `;

  return `
    <div style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; color: #0f172a; background: #0b1224; padding: 32px;">
      <div style="max-width: 680px; margin: 0 auto; background: linear-gradient(140deg,#0f172a,#111827 55%,#0b1224); border: 1px solid #1e293b; border-radius: 16px; padding: 28px; color: #e2e8f0;">
        <p style="font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; color: #7c3aed; margin: 0 0 10px;">Willkommen</p>
        <h1 style="margin: 0 0 12px; font-size: 24px; line-height: 1.3;">Danke für dein Vertrauen in ${productName}</h1>
        <p style="margin: 0 0 14px; font-size: 15px; color: #cbd5e1; line-height: 1.6;">
          ${vision}
        </p>
        ${screenshotsHtml}
        ${roadmapHtml}
        ${
          ctaUrl
            ? `<div style="margin-top: 22px;">
                <a href="${ctaUrl}" style="display: inline-block; background: #22c55e; color: #0b1224; text-decoration: none; padding: 12px 18px; border-radius: 12px; font-weight: 700;">
                  Dashboard öffnen
                </a>
              </div>`
            : ""
        }
      </div>
      <p style="text-align: center; margin-top: 16px; font-size: 12px; color: #94a3b8;">
        Du kannst dich jederzeit abmelden. Wir schicken nur relevante Updates.
      </p>
    </div>
  `;
}
