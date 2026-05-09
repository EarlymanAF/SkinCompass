"use client";

import React, { useEffect, useState } from "react";
import type { InventoryResponse, PricedInventoryItem } from "@/app/api/inventory/route";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(value: number | null) {
  if (value === null) return "—";
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
}

function withSteamSize(url: string) {
  if (!url.includes("/economy/image/")) return url;
  if (/\/\d+x\d+$/i.test(url)) return url;
  return `${url}/128x128`;
}

function wearShort(wear: string | null) {
  if (!wear) return null;
  const map: Record<string, string> = {
    "Factory New": "FN",
    "Minimal Wear": "MW",
    "Field-Tested": "FT",
    "Well-Worn": "WW",
    "Battle-Scarred": "BS",
  };
  return map[wear] ?? wear;
}

type SortKey = "skincompass" | "steam" | "name";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-[24px] border border-border bg-surface p-6 shadow-card">
      <div className="mb-3 h-4 w-32 rounded bg-gray-200" />
      <div className="h-8 w-48 rounded bg-gray-200" />
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex animate-pulse items-center gap-4 rounded-2xl border border-border bg-white p-4">
      <div className="h-12 w-12 flex-shrink-0 rounded-xl bg-gray-200" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-48 rounded bg-gray-200" />
        <div className="h-3 w-32 rounded bg-gray-100" />
      </div>
      <div className="h-5 w-20 rounded bg-gray-200" />
      <div className="h-5 w-20 rounded bg-gray-200" />
    </div>
  );
}

// ─── Item Row ─────────────────────────────────────────────────────────────────

function ItemRow({ item }: { item: PricedInventoryItem }) {
  const label = item.wear
    ? `${item.weapon} | ${item.skin} (${wearShort(item.wear)})`
    : item.market_hash_name;

  const badgeBase = "rounded-full px-2 py-0.5 text-[11px] font-medium";

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-white p-4 transition hover:border-indigo-200 hover:bg-gray-50/40">
      {/* Icon */}
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-gray-50">
        {item.icon_url ? (
          <img
            src={`https://community.cloudflare.steamstatic.com/economy/image/${item.icon_url}/128x128`}
            alt={item.market_hash_name}
            className="max-h-full max-w-full object-contain"
            loading="lazy"
          />
        ) : (
          <span className="text-2xl">🔫</span>
        )}
      </div>

      {/* Name + Badges */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{label}</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {item.stattrak && (
            <span className={`${badgeBase} bg-amber-100 text-amber-700`}>StatTrak™</span>
          )}
          {item.souvenir && (
            <span className={`${badgeBase} bg-yellow-100 text-yellow-700`}>Souvenir</span>
          )}
          {item.count > 1 && (
            <span className={`${badgeBase} bg-slate-100 text-slate-600`}>×{item.count}</span>
          )}
          {!item.skin_variant_id && (
            <span className={`${badgeBase} bg-gray-100 text-gray-400`}>kein Preis</span>
          )}
        </div>
      </div>

      {/* Prices */}
      <div className="flex shrink-0 flex-col items-end gap-1 text-right text-sm">
        {item.total_skincompass !== null ? (
          <span className="font-semibold text-indigo-600">{formatPrice(item.total_skincompass)}</span>
        ) : item.total_steam !== null ? (
          <span className="font-semibold text-foreground">{formatPrice(item.total_steam)}</span>
        ) : (
          <span className="text-secondary">—</span>
        )}
        {item.total_skincompass !== null && item.total_steam !== null && (
          <span className="text-xs text-secondary">Steam {formatPrice(item.total_steam)}</span>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const [data, setData] = useState<InventoryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("skincompass");

  useEffect(() => {
    fetch("/api/inventory", { cache: "no-store" })
      .then((res) => res.json())
      .then((json: InventoryResponse & { error?: string }) => {
        if (json.error) {
          setError(json.error);
        } else {
          setData(json);
        }
      })
      .catch(() => setError("Verbindung zum Server fehlgeschlagen."))
      .finally(() => setLoading(false));
  }, []);

  const sortedItems: PricedInventoryItem[] = React.useMemo(() => {
    if (!data) return [];
    return [...data.items].sort((a, b) => {
      if (sortKey === "name") {
        return a.market_hash_name.localeCompare(b.market_hash_name);
      }
      if (sortKey === "steam") {
        const av = a.total_steam ?? -1;
        const bv = b.total_steam ?? -1;
        return bv - av;
      }
      // default: skincompass
      const av = a.total_skincompass ?? a.total_steam ?? -1;
      const bv = b.total_skincompass ?? b.total_steam ?? -1;
      return bv - av;
    });
  }, [data, sortKey]);

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: "skincompass", label: "SC Ø-Preis" },
    { key: "steam", label: "Steam Preis" },
    { key: "name", label: "Name" },
  ];

  return (
    <main className="mx-auto max-w-5xl px-6 py-8 md:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Dein CS2 Inventar</h1>
        {data && (
          <p className="mt-1 text-sm text-secondary">
            {data.total_count} Items · davon {data.matched_count} bewertet
          </p>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-2xl border border-rose-300 bg-rose-50 px-5 py-4 text-sm text-rose-800">
          {error}
        </div>
      )}

      {/* Value cards */}
      {loading ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : data && !error ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[24px] border border-border bg-surface p-6 shadow-card transition duration-200 hover:border-indigo-300 hover:shadow-lg">
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-secondary">
              Steam Market
            </p>
            <p className="text-3xl font-bold text-foreground">
              {formatPrice(data.total_steam_market)}
            </p>
          </div>
          <div className="rounded-[24px] border border-border bg-indigo-50 p-6 shadow-card transition duration-200 hover:border-indigo-300 hover:shadow-lg">
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-indigo-500">
              SkinCompass Ø
            </p>
            <p className="text-3xl font-bold text-indigo-700">
              {formatPrice(data.total_skincompass_avg)}
            </p>
            <p className="mt-1 text-xs text-indigo-400">Ø aus Skinport + Skinbaron</p>
          </div>
        </div>
      ) : null}

      {/* Item list */}
      {!loading && data && !error && (
        <section className="rounded-[24px] border border-border bg-surface p-5 shadow-card">
          {/* Sort controls */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-secondary">Sortieren nach:</span>
            {sortOptions.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSortKey(key)}
                className={`rounded-button px-3 py-1.5 text-xs font-medium transition ${
                  sortKey === key
                    ? "bg-indigo-600 text-white"
                    : "border border-border bg-white text-foreground hover:bg-gray-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Items */}
          <div className="space-y-2">
            {sortedItems.length === 0 ? (
              <p className="py-8 text-center text-sm text-secondary">
                Keine marktfähigen Items im Inventar gefunden.
              </p>
            ) : (
              sortedItems.map((item) => (
                <ItemRow key={item.market_hash_name} item={item} />
              ))
            )}
          </div>

          {data.cached_at && (
            <p className="mt-4 text-right text-xs text-secondary">
              Zuletzt geladen:{" "}
              {new Date(data.cached_at).toLocaleTimeString("de-DE", {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              Uhr · Cache: 15 Min
            </p>
          )}
        </section>
      )}

      {/* Skeleton item list */}
      {loading && !error && (
        <section className="rounded-[24px] border border-border bg-surface p-5 shadow-card">
          <div className="mb-4 flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 w-24 animate-pulse rounded-button bg-gray-200" />
            ))}
          </div>
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
