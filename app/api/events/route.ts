import { NextResponse } from "next/server";
import { insertProductEvent, normalizeProductEvent } from "@/lib/product-events";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body: unknown = await req.json().catch(() => null);
  const event = normalizeProductEvent(body);

  if (!event) {
    return NextResponse.json(
      {
        error: "Ungültiges Event-Payload.",
      },
      { status: 400 },
    );
  }

  try {
    await insertProductEvent(event);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unbekannter Fehler";
    return NextResponse.json(
      {
        error: "Event konnte nicht gespeichert werden.",
        details: message,
      },
      { status: 500 },
    );
  }
}
