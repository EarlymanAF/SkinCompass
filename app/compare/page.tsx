"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { WEARS, WEAR_LABEL_DE, type WearEN } from "@/data/wears";
import { stripWeaponPrefix } from "@/lib/skin-utils";
import staticWeapons from "@/data/weapons.json";
import type { ProductEventName, ProductEventProps } from "@/lib/types";

type PriceRow = {
  marketplace: string;
  fee: string;
  currency: string;
  finalPrice: number | null;
  listingsCount: number | null;
  url: string;
  lastUpdated: string | null;
};

type ApiSkin = {
  name?: string;
  wears?: string[];
  image?: string | null;
};

type PricesApiResponse = {
  rows?: PriceRow[];
  resultCount?: number;
  freshnessSeconds?: number | null;
  error?: string;
};

const SESSION_ID_STORAGE_KEY = "skincompass_compare_session_id";

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

function formatFreshness(seconds: number | null): string {
  if (seconds == null) return "unbekannt";
  if (seconds < 60) return "gerade eben";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `vor ${minutes} Minute${minutes === 1 ? "" : "n"}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `vor ${hours} Stunde${hours === 1 ? "" : "n"}`;
  const days = Math.floor(hours / 24);
  return `vor ${days} Tag${days === 1 ? "" : "en"}`;
}

function createClientSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
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
  const [resultCount, setResultCount] = useState<number | null>(null);
  const [freshnessSeconds, setFreshnessSeconds] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const sessionIdRef = useRef<string | null>(null);

  function getSessionId() {
    if (sessionIdRef.current) return sessionIdRef.current;
    if (typeof window === "undefined") return null;

    const existing = window.localStorage.getItem(SESSION_ID_STORAGE_KEY);
    if (existing) {
      sessionIdRef.current = existing;
      return existing;
    }

    const created = createClientSessionId();
    window.localStorage.setItem(SESSION_ID_STORAGE_KEY, created);
    sessionIdRef.current = created;
    return created;
  }

  function trackCompareEvent(eventName: ProductEventName, props: ProductEventProps = {}) {
    const sessionId = getSessionId();
    const payload = {
      eventName,
      sessionId,
      page: "/compare",
      props,
    };

    void fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => null);
  }

  useEffect(() => {
    trackCompareEvent("compare_opened");
  }, []);

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
    setResultCount(null);
    setFreshnessSeconds(null);
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
    setResultCount(null);
    setFreshnessSeconds(null);
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
    const startedAt = performance.now();

    try {
      setHasSearched(true);
      setLoading(true);
      setError(null);
      setRows(null);
      setResultCount(null);
      setFreshnessSeconds(null);

      trackCompareEvent("compare_search_submitted", {
        weapon,
        skin,
        wear,
      });

      const query = new URLSearchParams({ weapon, skin, wear }).toString();
      const res = await fetch(`/api/prices?${query}`, { cache: "no-store" });

      const data = (await res.json()) as PricesApiResponse;
      if (!res.ok) {
        if (res.status === 404) {
          setRows([]);
          setResultCount(0);
          setFreshnessSeconds(null);
          trackCompareEvent("compare_no_results", {
            weapon,
            skin,
            wear,
            reason: "not_found",
            durationMs: Math.round(performance.now() - startedAt),
          });
          return;
        }

        const errMsg = data?.error ?? "Fehler beim Laden der Preise";
        throw new Error(errMsg);
      }

      const receivedRows = Array.isArray(data?.rows) ? data.rows : [];
      const calculatedResultCount =
        typeof data?.resultCount === "number"
          ? data.resultCount
          : receivedRows.filter((row) => row.finalPrice !== null && row.listingsCount !== 0).length;
      const receivedFreshness = typeof data?.freshnessSeconds === "number" ? data.freshnessSeconds : null;

      setRows(receivedRows);
      setResultCount(calculatedResultCount);
      setFreshnessSeconds(receivedFreshness);

      const durationMs = Math.round(performance.now() - startedAt);
      if (calculatedResultCount > 0) {
        trackCompareEvent("compare_results_shown", {
          weapon,
          skin,
          wear,
          resultCount: calculatedResultCount,
          freshnessSeconds: receivedFreshness,
          durationMs,
        });
      } else {
        trackCompareEvent("compare_no_results", {
          weapon,
          skin,
          wear,
          reason: "no_offers",
          durationMs,
        });
      }
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
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              const nextWeapon = e.target.value;
              setWeapon(nextWeapon);
              if (nextWeapon) {
                trackCompareEvent("compare_weapon_selected", { weapon: nextWeapon });
              }
            }}
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
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              const nextSkin = e.target.value;
              setSkin(nextSkin);
              if (nextSkin) {
                trackCompareEvent("compare_skin_selected", {
                  weapon,
                  skin: nextSkin,
                });
              }
            }}
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
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              const nextWear = e.target.value as WearEN;
              setWear(nextWear);
              if (nextWear) {
                trackCompareEvent("compare_wear_selected", {
                  weapon,
                  skin,
                  wear: nextWear,
                });
              }
            }}
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
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
              Für diese Kombination wurden aktuell keine Preise gefunden. Probiere eine andere Wear-Stufe oder einen
              ähnlichen Skin.
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setWear("")}
                  className="rounded-button border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-900"
                >
                  Andere Wear wählen
                </button>
                <button
                  type="button"
                  onClick={() => setSkin("")}
                  className="rounded-button border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-900"
                >
                  Anderen Skin wählen
                </button>
              </div>
            </div>
          )}

          {!loading && !error && rows && rows.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-indigo-100 px-2.5 py-1 font-medium text-indigo-700">
                  {resultCount ?? 0} aktive Angebote
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                  Datenstand: {formatFreshness(freshnessSeconds)}
                </span>
              </div>

              {resultCount === 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Aktuell hat keiner der gelisteten Marktplätze ein aktives Angebot für diese Kombination.
                </div>
              )}

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
                    {rows.map((row, index) => {
                      const noOffers = row.finalPrice === null || row.listingsCount === 0;
                      const isBestprice = index === 0 && !noOffers;
                      return (
                        <tr key={`${row.marketplace}-${index}`} className="hover:bg-gray-50/70">
                          <td className="px-5 py-3 text-foreground">
                            <div className="flex items-center gap-2">
                              <span>{row.marketplace}</span>
                              {isBestprice && (
                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                                  Bestpreis
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-secondary">{row.fee}</td>
                          {noOffers ? (
                            <td colSpan={4} className="px-5 py-3 text-sm text-secondary italic text-center">
                              Keine Angebote verfügbar
                            </td>
                          ) : (
                            <>
                              <td className="px-5 py-3 font-semibold text-foreground">
                                {formatPrice(row.finalPrice!, row.currency)}
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
                            </>
                          )}
                        </tr>
                      );
                    })}
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
