import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { confirmEmailTemplate } from "@/lib/emailTemplates";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const body: unknown = await req.json().catch(() => null);
  const emailRaw =
    body && typeof body === "object"
      ? (body as Record<string, unknown>).email
      : undefined;
  const email = typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Ungültige E-Mail-Adresse." }, { status: 400 });
  }

  const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
  const resendApiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseWriteKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseWriteKey) {
    return NextResponse.json(
      { error: "Server ist nicht korrekt konfiguriert. Datenbank-Zugang fehlt." },
      { status: 500 },
    );
  }

  const shouldSendConfirmation = Boolean(resendApiKey && emailFrom);
  const supabase = createClient(supabaseUrl, supabaseWriteKey);

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

  const nextStatus = shouldSendConfirmation ? "pending" : "confirmed";
  const confirmedAt = shouldSendConfirmation ? null : new Date().toISOString();

  const { error: upsertError } = await supabase
    .from("email_signups")
    .upsert(
      {
        email,
        status: nextStatus,
        token,
        confirmed_at: confirmedAt,
      },
      { onConflict: "email" },
    );

  if (upsertError) {
    return NextResponse.json({ error: "Konnte Anmeldung nicht speichern." }, { status: 500 });
  }

  if (shouldSendConfirmation) {
    const resend = new Resend(resendApiKey);
    const confirmUrl = `${baseUrl.replace(/\/$/, "")}/api/confirm?token=${token}`;
    const html = confirmEmailTemplate({ confirmUrl, productName: "SkinCompass" });

    const { error: mailError } = await resend.emails.send({
      from: emailFrom!,
      to: [email],
      subject: "Bitte bestätige deine Early-Access-Anmeldung",
      html,
    });

    if (mailError) {
      return NextResponse.json({ error: "E-Mail-Versand fehlgeschlagen." }, { status: 500 });
    }

    return NextResponse.json({ message: "Check dein Postfach und bestätige die Anmeldung." });
  }

  return NextResponse.json({ message: "Danke! Deine Anmeldung wurde gespeichert." });
}
