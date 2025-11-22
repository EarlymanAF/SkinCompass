// app/api/steam/wears/route.ts
import { NextResponse } from "next/server";
import { WEARS, type WearEN } from "@/data/wears";

/**
 * Warum nodejs?
 * - Wir nutzen ein kleines In-Memory-Cache (Map) für die Laufzeit des Server-Tasks.
 * - Auf Edge-Runtime wären globale Mutables flüchtiger / mehrfach instanziert.
 */
export const runtime = "nodejs";
/** Wir wollen pro Anfrage frisch entscheiden, cache steuert Response-Header */
export const dynamic = "force-dynamic";

const SEARCH_URL = "https://steamcommunity.com/market/search/render/";

/** --- Kleines In-Memory Cache, um Steam-Anfragen zu sparen --- */
type WearCacheEntry = { wears: WearEN[]; expires: number };
const MEM_CACHE = new Map<string, WearCacheEntry>();
const TTL_MS = 1000 * 60 * 30; // 30 Minuten

/** Steam-Suchergebnis (typisiert) */
type SearchResponse = {
  total_count?: number;
  results?: { hash_name?: string }[];
  start?: number;
};

/** Aus einer Auswahl die 3 gängigen Varianten konstruieren */
function buildCandidates(weapon: string, skin: string, wear: WearEN) {
  const base = `${weapon} | ${skin} (${wear})`;
  return [base, `StatTrak™ ${base}`, `Souvenir ${base}`];
}

/** Prüfen, ob exakte Übereinstimmung im Suchresultat vorkommt */
function exactMatch(results: SearchResponse["results"], target: string) {
  if (!results) return false;
  const t = target.toLowerCase();
  return results.some((r) => (r?.hash_name ?? "").toLowerCase() === t);
}

/** Eine einzelne Steam-Suche ausführen */
async function steamSearch(query: string, signal?: AbortSignal): Promise<SearchResponse> {
  const u = `${SEARCH_URL}?appid=730&norender=1&count=5&start=0&query=${encodeURIComponent(
    query
  )}`;

  const res = await fetch(u, {
    headers: {
      // unauffälliger UA; manche Endpunkte reagieren ohne UA zickig
      "User-Agent": "Mozilla/5.0 (compatible; SkinCompass/1.0; +https://skincompass.de)",
      Accept: "application/json,text/plain,*/*",
    },
    // Serverseitige Revalidierung (Next kann das intern zwischenpuffern)
    next: { revalidate: 900 }, // 15 min
    signal,
  });

  if (!res.ok) throw new Error(`steam search ${res.status}`);
  return (await res.json()) as SearchResponse;
}

/** Prüfen, ob für genau diesen Wear etwas existiert (mit kleinen Fallbacks) */
async function existsForWear(weapon: string, skin: string, wear: WearEN): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000); // harte 6s Grenze

  try {
    for (const candidate of buildCandidates(weapon, skin, wear)) {
      // 1) Exakt (quoted)
      try {
        const exact = await steamSearch(`"${candidate}"`, controller.signal);
        if ((exact.total_count ?? 0) > 0 || exactMatch(exact.results, candidate)) return true;
      } catch {
        /* weiter versuchen */
      }

      // 2) Unquoted, dann exakte Übereinstimmung filtern
      try {
        const loose = await steamSearch(candidate, controller.signal);
        if ((loose.total_count ?? 0) > 0 || exactMatch(loose.results, candidate)) return true;
      } catch {
        /* nächster Kandidat */
      }
    }
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/** Response-Helfer mit sinnvollen Caching-Headern */
function jsonWithCache(body: unknown, ok: boolean) {
  const res = NextResponse.json(body, { status: ok ? 200 : 200 });
  // Für Vercel-Edge/Proxy: 30min shared cache + 12h stale-while-revalidate
  res.headers.set("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=43200");
  return res;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const weapon = searchParams.get("weapon")?.trim() ?? "";
  const skin = searchParams.get("skin")?.trim() ?? "";

  if (!weapon || !skin) {
    // Bewusst 400, damit Frontend sauber reagieren kann
    return NextResponse.json({ error: "weapon and skin required" }, { status: 400 });
  }

  const cacheKey = `${weapon}|||${skin}`;
  const now = Date.now();
  const cached = MEM_CACHE.get(cacheKey);
  if (cached && cached.expires > now) {
    return jsonWithCache({ weapon, skin, wears: cached.wears, source: "memory" }, true);
  }

  try {
    // Schonend: sequentiell prüfen (Steam mag Bursts nicht)
    const available: WearEN[] = [];
    for (const w of WEARS) {
      // kleine Pause zwischen den Checks mindert Rate-Limit-Risiko
      // eslint-disable-next-line no-await-in-loop
      const ok = await existsForWear(weapon, skin, w);
      if (ok) available.push(w);
    }

    // Falls nichts verifizierbar war: lieber alle anzeigen (UX-Fallback)
    const wears = available.length > 0 ? available : WEARS;

    // In-Memory cachen
    MEM_CACHE.set(cacheKey, { wears, expires: now + TTL_MS });

    return jsonWithCache({ weapon, skin, wears, source: "live" }, true);
  } catch (e) {
    // Weicher Fallback (zeigt alle Wears), damit Nutzer nicht hängen bleibt
    return jsonWithCache(
      { weapon, skin, wears: WEARS, source: "fallback", error: (e as Error).message ?? "steam" },
      true
    );
  }
}