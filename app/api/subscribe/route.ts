import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { confirmEmailTemplate } from "@/lib/emailTemplates";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Ungültige E-Mail-Adresse." }, { status: 400 });
  }

  const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
  const resendApiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!resendApiKey || !emailFrom || !supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: "Server ist nicht korrekt konfiguriert. Env Vars fehlen." },
      { status: 500 },
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const resend = new Resend(resendApiKey);

  const token = crypto.randomUUID().replace(/-/g, "");

  const { data: existing, error: existingError } = await supabase
    .from("email_signups")
    .select("status, token")
    .eq("email", email)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: "Konnte Eintrag nicht prüfen." }, { status: 500 });
  }

  if (existing?.status === "confirmed") {
    return NextResponse.json({ message: "Bereits bestätigt. Danke!" });
  }

  const { error: upsertError } = await supabase
    .from("email_signups")
    .upsert(
      {
        email,
        status: "pending",
        token,
        confirmed_at: null,
      },
      { onConflict: "email" },
    );

  if (upsertError) {
    return NextResponse.json({ error: "Konnte Anmeldung nicht speichern." }, { status: 500 });
  }

  const confirmUrl = `${baseUrl.replace(/\/$/, "")}/api/confirm?token=${token}`;
  const html = confirmEmailTemplate({ confirmUrl, productName: "SkinCompass" });

  const { error: mailError } = await resend.emails.send({
    from: emailFrom,
    to: [email],
    subject: "Bitte bestätige deine Early-Access-Anmeldung",
    html,
  });

  if (mailError) {
    return NextResponse.json({ error: "E-Mail-Versand fehlgeschlagen." }, { status: 500 });
  }

  return NextResponse.json({ message: "Check dein Postfach und bestätige die Anmeldung." });
}
