// app/api/steam/skins/route.ts
import { NextResponse } from "next/server";
import { fetchWithRetry } from "@/lib/rate-limit";
import { baseSkinNameFromHash, parseHashName } from "@/lib/steam-normalize";
import { memoGet, memoSet } from "@/lib/memo";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SEARCH_URL = "https://steamcommunity.com/market/search/render/";
type SearchResponse = {
  success?: boolean;
  total_count?: number;
  start?: number;
  results?: Array<{ hash_name?: string }>;
};

type LocalIndexItem = {
  market_hash_name?: string;
  name?: string;
  icon_url?: string;
};

function localIndexPath() {
  return path.join(process.cwd(), "data", "skins.json");
}

async function loadLocalIndex(): Promise<LocalIndexItem[] | null> {
  try {
    const p = localIndexPath();
    const raw = await fs.readFile(p, "utf8");
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as LocalIndexItem[]) : null;
  } catch {
    return null;
  }
}

function filterIndexByWeapon(items: LocalIndexItem[], weapon: string): string[] {
  const out = new Set<string>();
  for (const it of items) {
    const h = it.market_hash_name || it.name || "";
    if (!h) continue;
    const parsed = parseHashName(h);
    if ((parsed.weapon ?? "").toLowerCase() === weapon.toLowerCase()) {
      const base = baseSkinNameFromHash(h);
      if (base) out.add(base);
    }
  }
  return Array.from(out);
}

async function saveSeed(weapon: string, skins: string[]) {
  try {
    const file = seedPathForWeapon(weapon);
    await fs.mkdir(path.dirname(file), { recursive: true });
    const payload = { weapon, skins: Array.from(new Set(skins)).sort((a, b) => a.localeCompare(b, "de")) };
    await fs.writeFile(file, JSON.stringify(payload, null, 2), "utf8");
  } catch {
    // ignore disk errors
  }
}

function seedPathForWeapon(weapon: string) {
  const safe = weapon.replace(/[^A-Za-z0-9\- ]/g, "").replace(/\s+/g, "-");
  return path.join(process.cwd(), "data", "cached", `${safe}.json`);
}

async function loadSeed(weapon: string): Promise<string[] | null> {
  try {
    const file = await fs.readFile(seedPathForWeapon(weapon), "utf8");
    const json = JSON.parse(file) as { skins?: string[] };
    return Array.isArray(json.skins) ? json.skins : null;
  } catch {
    return null;
  }
}

async function fetchPage(query: string, start: number, count: number): Promise<SearchResponse> {
  const url = `${SEARCH_URL}?appid=730&norender=1&start=${start}&count=${count}&query=${encodeURIComponent(
    query
  )}`;
  const res = await fetchWithRetry(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; SkinCompassBot/1.0)" },
    next: { revalidate: 900 },
  });
  if (!res.ok) throw new Error(`steam search ${res.status}`);
  return (await res.json()) as SearchResponse;
}

// ... oben unverändert

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const weapon = searchParams.get("weapon")?.trim();
  const pagesParam = Math.max(0, Math.min(20, Number(searchParams.get("pages") || 6)));
  const count = Math.max(10, Math.min(50, Number(searchParams.get("count") || 25)));

  const localOnly = searchParams.get("localOnly") === "1" || searchParams.get("source") === "local";
  const preferLocal = localOnly || searchParams.get("preferLocal") === "1";
  const localIndex = await loadLocalIndex();

  if (!weapon) {
    return NextResponse.json({ error: "weapon required" }, { status: 400 });
  }

  const mKey = `skins:${weapon}:${pagesParam}:${count}:localOnly=${localOnly}:preferLocal=${preferLocal}`;
  const memo = memoGet<{ skins: string[] }>(mKey);
  if (memo) {
    return NextResponse.json({
      weapon,
      source: "memory",
      count: memo.skins.length,
      skins: memo.skins,
    });
  }

  // ⬇️ Seed vorab laden (damit wir später sicher mergen)
  const seed = await loadSeed(weapon);

  // 🔎 Lokaler Index zuerst (je nach Flag)
  let localList: string[] = [];
  if (localIndex) {
    localList = filterIndexByWeapon(localIndex, weapon);
  }

  if (preferLocal && localList.length) {
    const union = new Set<string>(localList);
    const seedMaybe = await loadSeed(weapon);
    if (seedMaybe?.length) seedMaybe.forEach((s) => union.add(s));
    const out = Array.from(union).sort((a, b) => a.localeCompare(b, "de"));
    memoSet(mKey, { skins: out }, 10 * 60 * 1000);
    return NextResponse.json({ weapon, source: localOnly ? "local" : "local+seed", count: out.length, skins: out });
  }

  // Wenn localOnly gesetzt ist, aber kein Index gefunden wurde, versuche wenigstens Seeds
  if (localOnly) {
    if (seed?.length) {
      const out = Array.from(new Set(seed)).sort((a, b) => a.localeCompare(b, "de"));
      memoSet(mKey, { skins: out }, 10 * 60 * 1000);
      {
        const res = NextResponse.json({ weapon, source: "seed", count: out.length, skins: out }, { status: 200 });
        res.headers.set("Cache-Control", "s-maxage=900, stale-while-revalidate=3600");
        return res;
      }
    }
    return NextResponse.json({ weapon, source: "local", count: 0, skins: [] });
  }

  try {
    const skins = new Set<string>();

    // Vorinitialisieren mit lokalen Daten, um doppelte Arbeit zu sparen
    if (localList.length) localList.forEach((s) => skins.add(s));
    if (seed?.length) seed.forEach((s) => skins.add(s));

    // 1) Live-Query (eng + locker)
    const queries = [`"${weapon} |"`, `${weapon} |`];
    for (const q of queries) {
      let start = 0;
      let fetchedPages = 0;
      let totalCount = Infinity;

      while (start < totalCount && fetchedPages < pagesParam) {
        const page = await fetchPage(q, start, count);
        const list = page.results ?? [];
        totalCount = page.total_count ?? totalCount;

        for (const r of list) {
          const h = r.hash_name;
          if (!h) continue;
          const parsed = parseHashName(h);
          if ((parsed.weapon ?? "").toLowerCase() !== weapon.toLowerCase()) continue;
          const base = baseSkinNameFromHash(h);
          if (base) skins.add(base);
        }

        if (list.length < count) break;
        fetchedPages++;
        start += count;
      }
    }

    // 2) ⬅️ MERGE: Seeds IMMER ergänzen (Union), damit Seeds sicher sichtbar sind
    if (seed?.length) {
      for (const s of seed) skins.add(s);
    }

    // 3) Ausgeben (sortiert)
    const out = Array.from(skins).sort((a, b) => a.localeCompare(b, "de"));

    // Persistiere Merge als Seed für diese Waffe
    saveSeed(weapon, out).catch(() => {});

    memoSet(mKey, { skins: out }, 10 * 60 * 1000); // 10min Memory-Cache

    const body = { weapon, source: seed?.length ? (out.length > (seed?.length ?? 0) ? "steam+seed" : "seed") : "steam", count: out.length, skins: out };
    const res = NextResponse.json(body);
    res.headers.set("Cache-Control", "s-maxage=900, stale-while-revalidate=3600");
    return res;
  } catch (e) {
    // Bei Fehler: zumindest Seeds liefern (falls vorhanden)
    if (seed?.length) {
      memoSet(mKey, { skins: seed }, 10 * 60 * 1000);
      {
        const res = NextResponse.json({ weapon, source: "seed", count: seed.length, skins: seed }, { status: 200 });
        res.headers.set("Cache-Control", "s-maxage=900, stale-while-revalidate=3600");
        return res;
      }
    }
    {
      const res = NextResponse.json(
        { error: (e as Error)?.message ?? "steam error", weapon, skins: [] },
        { status: 200 }
      );
      res.headers.set("Cache-Control", "s-maxage=60");
      return res;
    }
  }
}
