import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token")?.trim();

  if (!token) {
    return htmlResponse("Kein Token übermittelt.", 400);
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseWriteKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseWriteKey) {
    return htmlResponse("Server ist nicht korrekt konfiguriert. Env Vars fehlen.", 500);
  }

  const supabase = createClient(supabaseUrl, supabaseWriteKey);

  const { data: signup, error: fetchError } = await supabase
    .from("email_signups")
    .select("id, email, status")
    .eq("token", token)
    .maybeSingle();

  if (fetchError || !signup) {
    return htmlResponse("Token ungültig oder nicht gefunden.", 400);
  }

  const newToken = crypto.randomUUID().replace(/-/g, "");

  const { error: updateError } = await supabase
    .from("email_signups")
    .update({ status: "unsubscribed", token: newToken })
    .eq("id", signup.id);

  if (updateError) {
    return htmlResponse("Konnte Abmeldung nicht speichern.", 500);
  }

  return htmlResponse("Du wurdest abgemeldet. Danke, dass du es ausprobiert hast!");
}

function htmlResponse(message: string, status = 200) {
  return new NextResponse(
    `
    <!doctype html>
    <html lang="de">
      <head>
        <meta charset="utf-8" />
        <title>Abmeldung</title>
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
      status,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    },
  );
}
