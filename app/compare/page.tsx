"use client";

import React, { useEffect, useMemo, useState } from "react";
import { WEARS, WEAR_LABEL_DE, type WearEN } from "@/data/wears";
import { stripWeaponPrefix } from "@/lib/skin-utils";
import staticWeapons from "@/data/weapons.json";

type PriceRow = {
  marketplace: string;
  fee: string;
  currency: string;
  finalPrice: number;
  listingsCount: number | null;
  url: string;
  lastUpdated: string | null;
};

type ApiSkin = {
  name?: string;
  wears?: string[];
  image?: string | null;
};

function formatPrice(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

function formatRelativeTime(timestamp: string | null): string {
  if (!timestamp) return "—";
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  if (diffSeconds < 60) return "gerade eben";
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `vor ${diffMinutes} Minute${diffMinutes === 1 ? "" : "n"}`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `vor ${diffHours} Stunde${diffHours === 1 ? "" : "n"}`;
  const diffDays = Math.floor(diffHours / 24);
  return `vor ${diffDays} Tag${diffDays === 1 ? "" : "en"}`;
}

function withSteamSize(url: string) {
  if (!url.includes("/economy/image/")) return url;
  if (/\/\d+x\d+$/i.test(url)) return url;
  return `${url}/512x512`;
}

export default function ComparePage() {
  const [weapons, setWeapons] = useState<string[]>([]);
  const [loadingWeapons, setLoadingWeapons] = useState(true);
  const [weapon, setWeapon] = useState<string>("");
  const [skin, setSkin] = useState<string>("");
  const [wear, setWear] = useState<WearEN | "">("");

  const [skinOptions, setSkinOptions] = useState<string[]>([]);
  const [skinMeta, setSkinMeta] = useState<Record<string, { wears: WearEN[]; image?: string | null }>>({});
  const [loadingSkins, setLoadingSkins] = useState(false);

  const [wearOptions, setWearOptions] = useState<WearEN[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<PriceRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Waffen aus Supabase laden, Fallback auf lokales JSON
  useEffect(() => {
    fetch("/api/supabase/weapons", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: unknown) => {
        const list = Array.isArray(data) && (data as string[]).length > 0
          ? (data as string[])
          : (staticWeapons as string[]);
        setWeapons(list);
      })
      .catch(() => setWeapons(staticWeapons as string[]))
      .finally(() => setLoadingWeapons(false));
  }, []);

  // Skins laden wenn Waffe gewählt
  useEffect(() => {
    setSkin("");
    setWear("");
    setRows(null);
    setError(null);

    if (!weapon) {
      setSkinOptions([]);
      setSkinMeta({});
      setSelectedImage(null);
      return;
    }

    (async () => {
      try {
        setLoadingSkins(true);
        const params = new URLSearchParams({ weapon });
        const res = await fetch(`/api/steam/skins?${params.toString()}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data = await res.json();
        if (!Array.isArray(data)) {
          setSkinOptions([]);
          return;
        }

        const nameSet = new Set<string>();
        const meta: Record<string, { wears: Set<WearEN>; image?: string | null }> = {};

        for (const item of data as (ApiSkin | string)[]) {
          const entry = typeof item === "object" && item !== null ? (item as ApiSkin) : undefined;
          const rawName = entry?.name ?? (typeof item === "string" ? item : "");
          const display = stripWeaponPrefix(rawName, weapon) || rawName;
          if (!display) continue;
          nameSet.add(display);

          const current = meta[display] ?? { wears: new Set<WearEN>(), image: null };
          if (Array.isArray(entry?.wears)) {
            for (const value of entry.wears) {
              if ((WEARS as ReadonlyArray<string>).includes(value)) {
                current.wears.add(value as WearEN);
              }
            }
          }
          if (!current.image && entry?.image) current.image = entry.image;
          meta[display] = current;
        }

        const orderedNames = Array.from(nameSet.values());
        setSkinOptions(orderedNames);

        const mappedMeta: Record<string, { wears: WearEN[]; image?: string | null }> = {};
        for (const name of orderedNames) {
          const entry = meta[name];
          mappedMeta[name] = {
            wears: entry ? (Array.from(entry.wears.values()) as WearEN[]) : [],
            image: entry?.image ?? null,
          };
        }
        setSkinMeta(mappedMeta);
      } catch {
        setSkinOptions([]);
        setSkinMeta({});
        setSelectedImage(null);
      } finally {
        setLoadingSkins(false);
      }
    })();
  }, [weapon]);

  // Wear-Optionen aktualisieren wenn Skin gewählt
  useEffect(() => {
    setWear("");
    setRows(null);
    setError(null);
    setSelectedImage(null);

    if (!weapon || !skin) {
      setWearOptions([]);
      return;
    }

    const meta = skinMeta[skin];
    if (meta) {
      setWearOptions(meta.wears && meta.wears.length > 0 ? meta.wears : WEARS);
      setSelectedImage(meta.image ?? null);
      return;
    }
    setWearOptions(WEARS);
  }, [weapon, skin, skinMeta]);

  const wearsForSelection = useMemo(() => (skin ? wearOptions : []), [skin, wearOptions]);

  async function fetchPrices() {
    if (!weapon || !skin || !wear) return;
    try {
      setHasSearched(true);
      setLoading(true);
      setError(null);
      setRows(null);

      const query = new URLSearchParams({ weapon, skin, wear }).toString();
      const res = await fetch(`/api/prices?${query}`, { cache: "no-store" });

      const data: unknown = await res.json();
      if (!res.ok) {
        const errMsg =
          data && typeof data === "object"
            ? ((data as Record<string, unknown>).error as string) ?? "Fehler beim Laden"
            : "Fehler beim Laden der Preise";
        throw new Error(errMsg);
      }

      const rowsRaw = data && typeof data === "object" ? (data as Record<string, unknown>).rows : undefined;
      const receivedRows = Array.isArray(rowsRaw) ? (rowsRaw as PriceRow[]) : [];
      setRows(receivedRows);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unerwarteter Fehler beim Preisabruf.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const canSearch = Boolean(weapon && skin && wear);
  const previewImageSrc = selectedImage ? withSteamSize(selectedImage) : null;

  return (
    <main className="mx-auto max-w-7xl px-6 py-8 md:px-8">
      <section className="rounded-[24px] border border-border bg-surface p-4 shadow-card transition duration-200 hover:border-indigo-300 hover:shadow-lg md:p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
          <select
            className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200/60"
            value={weapon}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setWeapon(e.target.value)}
          >
            <option value="">{loadingWeapons ? "Lade Waffen…" : "Waffe wählen…"}</option>
            {weapons.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>

          <select
            className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none transition disabled:bg-gray-50 disabled:text-gray-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200/60"
            value={skin}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSkin(e.target.value)}
            disabled={!weapon || loadingSkins}
          >
            <option value="">
              {!weapon ? "Zuerst Waffe wählen" : loadingSkins ? "Lade Skins…" : "Skin wählen…"}
            </option>
            {skinOptions.map((skinName) => (
              <option key={skinName} value={skinName}>
                {skinName}
              </option>
            ))}
          </select>

          <select
            className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none transition disabled:bg-gray-50 disabled:text-gray-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200/60"
            value={wear}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setWear(e.target.value as WearEN)}
            disabled={!skin}
          >
            <option value="">{!skin ? "Zuerst Skin wählen" : "Wear wählen…"}</option>
            {wearsForSelection.map((value) => (
              <option key={value} value={value}>
                {WEAR_LABEL_DE[value]}
              </option>
            ))}
          </select>

          <button
            onClick={fetchPrices}
            disabled={!canSearch || loading}
            className="rounded-button bg-foreground px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Lädt…" : "Vergleichen"}
          </button>
        </div>
      </section>

      {hasSearched && (
        <section className="mt-6 rounded-[24px] border border-border bg-surface p-6 shadow-card">
          {loading && (
            <p className="rounded-2xl border border-border bg-white px-4 py-4 text-sm text-secondary">
              Marktdaten werden geladen…
            </p>
          )}

          {error && (
            <p className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-4 text-sm text-rose-800">
              {error}
            </p>
          )}

          {!loading && !error && rows && rows.length === 0 && (
            <p className="rounded-2xl border border-border bg-white px-4 py-4 text-sm text-secondary">
              Für diese Kombination wurden aktuell keine Preise gefunden.
            </p>
          )}

          {!loading && !error && rows && rows.length > 0 && (
            <div className="space-y-4">
              {previewImageSrc && (
                <div className="flex h-44 items-center justify-center overflow-hidden rounded-2xl border border-border bg-gray-50 p-3">
                  <img
                    src={previewImageSrc}
                    alt={`${weapon} | ${skin} (${wear})`}
                    className="max-h-full max-w-full object-contain object-center"
                    loading="eager"
                    decoding="async"
                  />
                </div>
              )}

              <div className="overflow-x-auto rounded-2xl border border-border bg-white">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left text-gray-600">
                    <tr>
                      <th scope="col" className="px-5 py-3 font-medium">
                        Marktplatz
                      </th>
                      <th scope="col" className="px-5 py-3 font-medium">
                        Gebühr
                      </th>
                      <th scope="col" className="px-5 py-3 font-medium">
                        Preis
                      </th>
                      <th scope="col" className="px-5 py-3 font-medium">
                        Angebote
                      </th>
                      <th scope="col" className="px-5 py-3 font-medium">
                        Aktion
                      </th>
                      <th scope="col" className="px-5 py-3 font-medium">
                        Zuletzt aktualisiert
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.map((row, index) => (
                      <tr key={`${row.marketplace}-${index}`} className="hover:bg-gray-50/70">
                        <td className="px-5 py-3 text-foreground">
                          <div className="flex items-center gap-2">
                            <span>{row.marketplace}</span>
                            {index === 0 && (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                                Bestpreis
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-secondary">{row.fee}</td>
                        <td className="px-5 py-3 font-semibold text-foreground">
                          {formatPrice(row.finalPrice, row.currency)}
                        </td>
                        <td className="px-5 py-3 text-secondary">
                          {row.listingsCount != null ? row.listingsCount.toLocaleString("de-DE") : "—"}
                        </td>
                        <td className="px-5 py-3">
                          <a
                            href={row.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex rounded-button border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-gray-50"
                          >
                            Zum Angebot
                          </a>
                        </td>
                        <td className="px-5 py-3 text-secondary text-sm">
                          {formatRelativeTime(row.lastUpdated)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
