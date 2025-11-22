// app/api/vendors/steam/route.ts
import { NextResponse } from "next/server";
import { fetchWithRetry } from "@/lib/rate-limit";

export const runtime = "nodejs";

// Steam currency ids: https://partner.steamgames.com/doc/store/pricing#SupportedCurrencies
const CURRENCY_ID: Record<string, number> = {
  USD: 1, GBP: 2, EUR: 3, CHF: 4, RUB: 5, BRL: 7, JPY: 8, NOK: 9,
  IDR: 10, MYR: 11, PHP: 12, SGD: 13, THB: 14, KRW: 16, TRY: 17, UAH: 18,
  MXN: 19, CAD: 20, AUD: 21, NZD: 22, CNY: 23, INR: 24, CLP: 25, PEN: 26,
  COP: 27, ZAR: 28, HKD: 29, TWD: 30, SAR: 31, AED: 32, ARS: 34, ILS: 35,
  KZT: 37, KWD: 38, QAR: 39, CRC: 40, UYU: 41, BGN: 42, HRK: 43, CZK: 44,
  DKK: 45, HUF: 46, RON: 47, SEK: 48, BYN: 49, ISK: 50, GEL: 51, EGP: 52,
};

// „€ 12,34“ / "$1.23" → 12.34
function parsePriceString(s: string): number | null {
  const trimmed = s.trim();
  // Remove currency symbols, NBSP, etc.
  const cleaned = trimmed
    .replace(/[^\d,.\-]/g, "")     // keep digits, comma, dot, minus
    .replace(/\u00A0/g, " ");      // nbsp → space

  // Heuristic: if both comma and dot: treat comma as thousands in US style, dot as decimal
  // If only comma present and looks like decimal, swap to dot.
  if (cleaned.includes(",") && !cleaned.includes(".")) {
    // "12,34" → "12.34"
    const normalized = cleaned.replace(",", ".");
    const n = Number(normalized);
    return Number.isFinite(n) ? n : null;
  }
  const n = Number(cleaned.replace(/,/g, "")); // "1,234.56" → "1234.56"
  return Number.isFinite(n) ? n : null;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const hash = searchParams.get("q")?.trim();     // market_hash_name
    const currency = (searchParams.get("currency") || "EUR").toUpperCase();

    if (!hash) {
      return NextResponse.json({ error: "Missing 'q' (market_hash_name)" }, { status: 400 });
    }
    const currId = CURRENCY_ID[currency] ?? 3; // default EUR

    const url = `https://steamcommunity.com/market/priceoverview/?appid=730&currency=${currId}&market_hash_name=${encodeURIComponent(hash)}`;

    // Timeout-Absicherung (z. B. 7s) und Retry/Throttle via fetchWithRetry
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    let res: Response;
    try {
      // 5-Minuten Revalidate auf CDN/Server, aber no-store vermeiden (wir wollen Caching zulassen)
      res = await fetchWithRetry(
        url,
        { next: { revalidate: 300 }, signal: controller.signal },
        4
      );
    } catch (e) {
      clearTimeout(timeout);
      if (e instanceof Error && e.name === "AbortError") {
        return NextResponse.json({ error: "Upstream timeout (Steam)" }, { status: 504 });
      }
      const message = e instanceof Error ? e.message : "Upstream error (Steam)";
      return NextResponse.json({ error: message }, { status: 502 });
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) {
      return NextResponse.json({ error: `Steam responded ${res.status}` }, { status: 502 });
    }

    const json = (await res.json()) as {
      success?: boolean;
      lowest_price?: string;   // e.g. "€ 12,34"
      median_price?: string;   // e.g. "€ 12,00"
      volume?: string;         // e.g. "123"
    };

    if (!json?.success) {
      return NextResponse.json({ error: "Steam response not successful", raw: json ?? null }, { status: 502 });
    }

    const lowest = json.lowest_price ? parsePriceString(json.lowest_price) : null;
    const median = json.median_price ? parsePriceString(json.median_price) : null;

    return NextResponse.json({
      market: "Steam Community Market",
      currency,
      lowest_price_text: json.lowest_price ?? null,
      median_price_text: json.median_price ?? null,
      volume: json.volume ?? null,
      lowest_price: lowest,
      median_price: median,
      url: `https://steamcommunity.com/market/listings/730/${encodeURIComponent(hash)}`,
      revalidateSeconds: 300,
      success: true,
    }, {
      // clientseitiges Caching unkritisch, Server revalidiert ohnehin
      headers: { "Cache-Control": "public, max-age=60" }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}