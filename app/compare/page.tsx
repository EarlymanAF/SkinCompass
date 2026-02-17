"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import EmailSignup from "@/components/EmailSignup";
import { BASE_COMPARE_INSIGHTS } from "@/lib/content/compare-insights";
import { WEARS, WEAR_LABEL_DE, type WearEN } from "@/data/wears";
import weapons from "@/data/weapons.json";
import { stripWeaponPrefix } from "@/lib/skin-utils";

type PriceRow = {
  marketplace: string;
  fee: string;
  currency: string;
  finalPrice: number;
  trend7d: string;
  priceLabel?: string | null;
  url: string;
};

type ApiSkin = {
  name?: string;
  wears?: string[];
  image?: string | null;
};

function toMarketHashName(weapon: string, skin: string, wear: WearEN) {
  const cleanSkin = skin
    .replace(/\s*\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)/gi, "")
    .trim();

  const base = cleanSkin.startsWith(`${weapon} |`) ? cleanSkin : `${weapon} | ${cleanSkin}`;
  if (base.toLowerCase().includes(wear.toLowerCase())) return base;
  return `${base} (${wear})`;
}

export default function ComparePage() {
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
        if (!res.ok) throw new Error(`API error for weapon ${weapon}: ${res.status}`);
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
            for (const w of entry.wears) {
              if ((WEARS as ReadonlyArray<string>).includes(w)) {
                current.wears.add(w as WearEN);
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

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Fehler beim Laden der Preise: ${errText}`);
      }

      const data: unknown = await res.json();
      const rowsRaw =
        data && typeof data === "object"
          ? (data as Record<string, unknown>).rows
          : undefined;
      const receivedRows = Array.isArray(rowsRaw) ? (rowsRaw as PriceRow[]) : [];
      const sorted = [...receivedRows].sort((a, b) => a.finalPrice - b.finalPrice);
      setRows(sorted);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unerwarteter Fehler beim Preisabruf.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const canSearch = !!weapon && !!skin && !!wear;
  const bestRow = rows && rows.length > 0 ? rows[0] : null;
  const secondRow = rows && rows.length > 1 ? rows[1] : null;
  const spread = bestRow && secondRow ? secondRow.finalPrice - bestRow.finalPrice : null;

  const dynamicInsights = [
    bestRow
      ? `Bestes Angebot aktuell: ${bestRow.marketplace} mit ${bestRow.priceLabel ?? `${bestRow.finalPrice.toFixed(2)} ${bestRow.currency}`}.`
      : "Noch kein Ergebnis vorhanden. Starte eine Suche für konkrete Marktwerte.",
    spread !== null
      ? `Preisabstand zwischen Platz 1 und 2: ${spread.toFixed(2)} ${bestRow?.currency ?? "EUR"}.`
      : "Bei nur einem Angebot fehlt ein direkter Marktvergleich.",
    rows && rows.length > 0
      ? "Die Liste ist nach effektivem Endpreis sortiert, inklusive Gebühren und Umrechnung."
      : "Vergleiche immer Endpreis statt Rohpreis, damit keine versteckten Kosten übersehen werden.",
  ];

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-6 py-8 md:px-8">
      <section className="rounded-[24px] border border-border bg-surface p-6 shadow-card md:p-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground md:text-3xl">Vergleichsportal</h1>
            <p className="mt-2 max-w-2xl text-secondary">
              Vergleiche Skinpreise marktübergreifend auf Basis von Endpreis, Gebühren und 7d-Trend.
            </p>
          </div>
          <Link href="/" className="rounded-button border border-border bg-white px-3 py-2 text-sm text-foreground hover:bg-gray-50">
            Zur Übersicht
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-foreground">Waffe</label>
            <select
              className="mt-1.5 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm"
              value={weapon}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setWeapon(e.target.value)}
            >
              <option value="">Bitte wählen...</option>
              {weapons.map((w: string) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">Skin</label>
            <select
              className="mt-1.5 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm disabled:bg-gray-50 disabled:text-gray-400"
              value={skin}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSkin(e.target.value)}
              disabled={!weapon || loadingSkins}
            >
              <option value="">{!weapon ? "Zuerst Waffe wählen" : loadingSkins ? "Lade Skins..." : "Bitte wählen..."}</option>
              {skinOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">Wear</label>
            <select
              className="mt-1.5 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm disabled:bg-gray-50 disabled:text-gray-400"
              value={wear}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setWear(e.target.value as WearEN)}
              disabled={!skin}
            >
              <option value="">{!skin ? "Zuerst Skin wählen" : "Bitte wählen..."}</option>
              {wearsForSelection.map((w) => (
                <option key={w} value={w}>
                  {WEAR_LABEL_DE[w]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={fetchPrices}
          disabled={!canSearch || loading}
          className="mt-6 inline-flex rounded-button bg-foreground px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {loading ? "Preise werden geladen..." : "Preise vergleichen"}
        </button>
      </section>

      <section className="rounded-[24px] border border-border bg-surface p-6 shadow-card md:p-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-foreground">Ergebnis</h2>
          {rows && rows.length > 0 && (
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
              {rows.length} Marktplätze gefunden
            </span>
          )}
        </div>

        {!hasSearched && (
          <p className="mt-4 rounded-[24px] border border-dashed border-border bg-white/60 px-4 py-4 text-sm text-secondary">
            Wähle eine Kombination aus Waffe, Skin und Wear, um den Vergleich zu starten.
          </p>
        )}

        {loading && (
          <p className="mt-4 rounded-[24px] border border-border bg-white px-4 py-4 text-sm text-secondary">
            Marktdaten werden geladen und nach Endpreis sortiert...
          </p>
        )}

        {error && (
          <p className="mt-4 rounded-[24px] border border-rose-300 bg-rose-50 px-4 py-4 text-sm text-rose-800">{error}</p>
        )}

        {!loading && !error && rows && rows.length === 0 && (
          <p className="mt-4 rounded-[24px] border border-border bg-white px-4 py-4 text-sm text-secondary">
            Für diese Kombination wurden aktuell keine Preise gefunden.
          </p>
        )}

        {!loading && !error && rows && rows.length > 0 && (
          <div className="mt-5 space-y-4">
            <div className="flex items-center gap-4 rounded-[24px] border border-border bg-white p-4">
              <div className="grid h-24 w-40 place-items-center overflow-hidden rounded-[24px] bg-gray-50">
                {skin && wear && (
                  <Image
                    src={
                      selectedImage
                        ? selectedImage
                        : `/api/steam/icon?name=${encodeURIComponent(
                            toMarketHashName(weapon, skin, wear as WearEN)
                          )}&size=256x256`
                    }
                    alt={`${weapon} | ${skin} (${wear})`}
                    width={256}
                    height={256}
                    className="h-full w-full object-contain"
                    unoptimized={!selectedImage || !selectedImage.startsWith("/")}
                  />
                )}
              </div>
              <div>
                <p className="text-sm text-muted">Auswahl</p>
                <p className="font-semibold text-foreground">{weapon}</p>
                <p className="text-sm text-secondary">
                  {skin} • {wear ? WEAR_LABEL_DE[wear as WearEN] : ""}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-[24px] border border-border bg-white">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 z-10 bg-gray-50 text-left text-gray-600">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-medium">Marktplatz</th>
                    <th scope="col" className="px-5 py-3 font-medium">Gebühr</th>
                    <th scope="col" className="px-5 py-3 font-medium">Endpreis</th>
                    <th scope="col" className="px-5 py-3 font-medium">Trend (7d)</th>
                    <th scope="col" className="px-5 py-3 font-medium">Aktion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((row, index) => {
                    const up = row.trend7d.startsWith("+");
                    return (
                      <tr key={row.marketplace} className="hover:bg-gray-50/80">
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
                          {row.priceLabel ? row.priceLabel : `${row.finalPrice.toFixed(2)} ${row.currency}`}
                        </td>
                        <td className={`px-5 py-3 font-medium ${up ? "text-emerald-600" : "text-rose-600"}`}>
                          {row.trend7d}
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-[24px] border border-border bg-surface p-6 shadow-card">
          <h2 className="text-xl font-semibold text-foreground">Entscheidungs-Insights</h2>
          <div className="mt-4 space-y-3">
            {dynamicInsights.map((insight) => (
              <p key={insight} className="rounded-[24px] border border-border bg-white/80 p-3 text-sm text-secondary">
                {insight}
              </p>
            ))}
            {BASE_COMPARE_INSIGHTS.map((insight) => (
              <p key={insight.id} className="rounded-[24px] border border-border bg-white/80 p-3 text-sm text-secondary">
                <span className="font-medium text-foreground">{insight.title}:</span> {insight.description}
              </p>
            ))}
          </div>
        </article>

        <article className="rounded-[24px] border border-border bg-surface p-6 shadow-card">
          <h2 className="text-xl font-semibold text-foreground">Preisalarm vormerken</h2>
          <p className="mt-2 text-sm text-secondary">
            Hinterlege deine E-Mail und wir informieren dich fruehzeitig ueber neue Features und Alert-Updates.
          </p>
          <div className="mt-4">
            <EmailSignup />
          </div>
        </article>
      </section>
    </main>
  );
}
