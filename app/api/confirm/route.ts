import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { welcomeEmailTemplate } from "@/lib/emailTemplates";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token")?.trim();

  if (!token) {
    return NextResponse.json({ error: "Token fehlt." }, { status: 400 });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!resendApiKey || !emailFrom || !supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: "Server ist nicht korrekt konfiguriert." }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const resend = new Resend(resendApiKey);

  const { data: signup, error: fetchError } = await supabase
    .from("email_signups")
    .select("id, email, status")
    .eq("token", token)
    .maybeSingle();

  if (fetchError || !signup) {
    return NextResponse.json({ error: "Token ungültig oder abgelaufen." }, { status: 400 });
  }

  if (signup.status === "confirmed") {
    return htmlResponse("Schon bestätigt. Danke, dass du dabei bist!");
  }

  const { error: updateError } = await supabase
    .from("email_signups")
    .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
    .eq("id", signup.id);

  if (updateError) {
    return NextResponse.json({ error: "Konnte Bestätigung nicht speichern." }, { status: 500 });
  }

  const welcomeHtml = welcomeEmailTemplate({
    vision:
      "SkinCompass wird zur führenden Plattform für moderne, datenbasierte Skin-Investments. Die Anwendung verbindet präzise Informationen mit einer klaren, reduzierten Nutzererfahrung und macht digitale Gegenstände so übersichtlich wie reale Wertanlagen.",
    screenshots: [],
    roadmap: [
      {
        title: "Transparente Übersicht",
        description: "Alle relevanten Skinpreise und Marktverläufe strukturiert, verständlich und jederzeit abrufbar.",
      },
      {
        title: "Reduziertes, hochwertiges Design",
        description: "Klare Oberfläche, die Daten in den Mittelpunkt stellt, ohne Ablenkung.",
      },
      {
        title: "Digitales Portfolio",
        description: "Steam-Inventar wie ein Investment-Portfolio: Wertentwicklung, Rendite seit Kauf, Trends über Zeit.",
      },
      {
        title: "Individuelle Watchlist",
        description: "Favoriten beobachten, Preisbewegungen verfolgen und Chancen früh erkennen.",
      },
      {
        title: "Entscheidungen auf Basis echter Daten",
        description: "Strukturierte Informationen, keine Rätselraten – nachvollziehbare Entscheidungen.",
      },
    ],
    productName: "SkinCompass",
  });

  // Welcome mail ist best effort: Fehler sollen nicht den Erfolg blockieren.
  await resend.emails.send({
    from: emailFrom,
    to: [signup.email],
    subject: "Willkommen bei SkinCompass 🚀",
    html: welcomeHtml,
  });

  return htmlResponse("Danke, deine E-Mail ist bestätigt. Wir halten dich auf dem Laufenden!");
}

function htmlResponse(message: string) {
  return new NextResponse(
    `
    <!doctype html>
    <html lang="de">
      <head>
        <meta charset="utf-8" />
        <title>Bestätigung</title>
        <style>
          body { margin: 0; font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; background: #f8fafc; color: #0f172a; }
          .card { max-width: 520px; margin: 80px auto; padding: 28px; background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.04); }
          .title { font-size: 24px; margin: 0 0 12px; }
          .text { margin: 0; font-size: 15px; color: #475569; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1 class="title">SkinCompass</h1>
          <p class="text">${message}</p>
        </div>
      </body>
    </html>
  `,
    {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    },
  );
}
