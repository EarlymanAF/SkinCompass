// app/api/prices/route.ts
import { NextResponse } from "next/server";
import { WEARS, WEAR_LABEL_DE, type WearEN } from "@/data/wears";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const weapon = searchParams.get("weapon")?.trim();
    const skin = searchParams.get("skin")?.trim();
    const wearParam = searchParams.get("wear")?.trim();

    // Wear sicher typisieren
    const wear = (wearParam ?? null) as WearEN | null;

    // einfache Validierung
    if (!weapon || !skin || !wear || !WEARS.includes(wear)) {
      return NextResponse.json(
        { error: "Missing or invalid params (weapon/skin/wear)" },
        { status: 400 }
      );
    }

    // MOCK-Daten (hier später echte Marktplatz-APIs anschließen)
    const base = Math.max(5, weapon.length * 2 + skin.length * 0.7);
    const noise = (n: number) => Math.round((base + n) * 100) / 100;

    const rows = [
      { marketplace: "Steam Community Market", fee: "15%",   currency: "EUR", finalPrice: noise(3.1) },
      { marketplace: "Buff163",                fee: "≈2.5%", currency: "EUR", finalPrice: noise(1.6) },
      { marketplace: "CSFloat",                fee: "5%",    currency: "EUR", finalPrice: noise(2.2) },
    ].map((r) => ({
      ...r,
      trend7d:
        Math.random() > 0.5
          ? `+${(Math.random() * 3).toFixed(1)}%`
          : `-${(Math.random() * 3).toFixed(1)}%`,
      url: "#",
    }));

    return NextResponse.json({
      query: {
        weapon,
        skin,
        wear,
        wearLabelDE: WEAR_LABEL_DE[wear],
      },
      rows,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}