"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { WEARS, WEAR_LABEL_DE, type WearEN } from "@/data/wears";
import weapons from "@/data/weapons.json";

/* --- Datentyp für Preiszeilen --- */
type PriceRow = {
  marketplace: string;
  fee: string;
  currency: string;
  finalPrice: number;
  trend7d: string;
  url: string;
};

/* --- Hilfsfunktion: Market Hash Name für Steam-Icon --- */
function toMarketHashName(weapon: string, skin: string, wear: WearEN) {
  // Entferne doppelte Waffenbezeichnungen und vorhandene Wear-Tags
  const cleanSkin = skin
    .replace(/\s*\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)/gi, "")
    .trim();

  // Wenn Skin bereits Waffenname enthält, lass ihn unverändert
  const base = cleanSkin.startsWith(`${weapon} |`) ? cleanSkin : `${weapon} | ${cleanSkin}`;

  // Füge Wear nur hinzu, wenn es nicht schon im Namen enthalten ist
  if (base.toLowerCase().includes(wear.toLowerCase())) {
    return base;
  }

  return `${base} (${wear})`;
}

export default function ComparePage() {
  const [weapon, setWeapon] = useState<string>("");
  const [skin, setSkin] = useState<string>("");
  const [wear, setWear] = useState<WearEN | "">("");

  const [skinOptions, setSkinOptions] = useState<string[]>([]);
  const [loadingSkins, setLoadingSkins] = useState(false);

  const [wearOptions, setWearOptions] = useState<WearEN[]>([]);
  const [loadingWears, setLoadingWears] = useState(false);

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<PriceRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* --- Wenn eine Waffe gewählt ist → Skins aus lokaler JSON-Datei laden --- */
  useEffect(() => {
    setSkin("");
    setWear("");
    setRows(null);
    setError(null);

    if (!weapon) {
      setSkinOptions([]);
      return;
    }

    (async () => {
      try {
        setLoadingSkins(true);
        const localPath = `/skins/${weapon}.json`;
        const res = await fetch(localPath);
        if (!res.ok) throw new Error(`Lokale Datei nicht gefunden: ${localPath}`);
        const data = await res.json();

        if (Array.isArray(data)) {
          const names = data.map((s: any) => s.name || s);
          const cleanNames = names.map((name: string) =>
            name
              .replace(/^.*\|\s*/g, "") // entfernt „AK-47 | “ oder andere Waffenpräfixe
              .replace(/\s*\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)/gi, "") // entfernt Zustände
              .trim()
          );
          setSkinOptions([...new Set(cleanNames as string[])]);
        } else if (data && Array.isArray(data.skins)) {
          const names = data.skins.map((s: any) => s.name || s);
          const cleanNames = names.map((name: string) =>
            name
              .replace(/^.*\|\s*/g, "")
              .replace(/\s*\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)/gi, "")
              .trim()
          );
          setSkinOptions([...new Set(cleanNames as string[])]);
        } else {
          console.error("Invalid skin data:", data);
          setSkinOptions([]);
        }
      } catch (err) {
        console.error("Fehler beim Laden der Skins:", err);
        setSkinOptions([]);
      } finally {
        setLoadingSkins(false);
      }
    })();
  }, [weapon]);

  /* --- Wenn Skin gewählt wurde → gültige Wears via API prüfen (mit Fallback) --- */
  useEffect(() => {
    setWear("");
    setRows(null);
    setError(null);

    if (!weapon || !skin) {
      setWearOptions([]);
      return;
    }

    (async () => {
      try {
        setLoadingWears(true);
        const params = new URLSearchParams({ weapon, skin }).toString();
        const res = await fetch(`/api/steam/wears?${params}`, { cache: "no-store" });
        const data = (await res.json()) as { wears?: WearEN[] };
        setWearOptions(data.wears && data.wears.length > 0 ? data.wears : WEARS);
      } catch {
        setWearOptions(WEARS);
      } finally {
        setLoadingWears(false);
      }
    })();
  }, [weapon, skin]);

  const wearsForSelection = useMemo(() => (skin ? wearOptions : []), [skin, wearOptions]);

  /* --- Preise holen --- */
  async function fetchPrices() {
    if (!weapon || !skin || !wear) return;

    try {
      setLoading(true);
      setError(null);
      setRows(null);

      // Anfrage an die lokale API, die den Steam-Market abfragt
      const query = new URLSearchParams({ weapon, skin, wear }).toString();
      const res = await fetch(`/api/prices?${query}`, { cache: "no-store" });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Fehler beim Laden der Preise: ${errText}`);
      }

      const data = await res.json();

      if (!data.rows || data.rows.length === 0) {
        throw new Error("Keine Preis-Daten gefunden.");
      }

      setRows(data.rows);
    } catch (err) {
      console.error("Fehler in fetchPrices:", err);
      const message = err instanceof Error ? err.message : "Unerwarteter Fehler beim Preisabruf.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const canSearch = !!weapon && !!skin && !!wear;

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
          ← Zur Startseite
        </Link>
      </div>

      <h1 className="mt-6 text-3xl md:text-4xl font-bold tracking-tight">
        Preisvergleich für CS2-Skins
      </h1>
      <p className="mt-2 text-gray-700 max-w-2xl">
        Wähle <strong>Waffe</strong>, <strong>Skin</strong> und <strong>Zustand</strong>. Wir zeigen Endpreise inkl. Gebühren &amp; Währungsumrechnung.
      </p>

      {/* Auswahl */}
      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {/* Waffe */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Waffe</label>
          <select
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
            value={weapon}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setWeapon(e.target.value)}
          >
            <option value="">Bitte wählen…</option>
            {weapons.map((w: string) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>

        {/* Skin (von Steam) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Skin</label>
          <select
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 disabled:bg-gray-50 disabled:text-gray-400"
            value={skin}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSkin(e.target.value)}
            disabled={!weapon || loadingSkins}
          >
            <option value="">
              {!weapon ? "Zuerst Waffe wählen" : loadingSkins ? "Lade Skins…" : "Bitte wählen…"}
            </option>
            {skinOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Zustand (DE-Labels, intern EN) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Zustand</label>
          <select
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 disabled:bg-gray-50 disabled:text-gray-400"
            value={wear}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setWear(e.target.value as WearEN)}
            disabled={!skin || loadingWears}
          >
            <option value="">
              {!skin ? "Zuerst Skin wählen" : loadingWears ? "Lade Zustände…" : "Bitte wählen…"}
            </option>
            {wearsForSelection.map((w) => (
              <option key={w} value={w}>
                {WEAR_LABEL_DE[w]}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Button */}
      <div className="mt-6">
        <button
          onClick={fetchPrices}
          disabled={!canSearch || loading}
          className="rounded-lg bg-black text-white px-4 py-2 disabled:opacity-50"
        >
          {loading ? "Laden…" : "Preise vergleichen"}
        </button>
      </div>

      {/* Fehlerhinweis */}
      {error && (
        <div className="mt-4 rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-rose-800">
          {error}
        </div>
      )}

      {/* Ergebnisse */}
      <section className="mt-8">
        {rows && rows.length > 0 && (
          <div className="space-y-6">
            {/* Vorschau mit Bild */}
            <div className="rounded-2xl border border-gray-200 bg-white p-4 flex items-center gap-4">
              <div className="w-36 h-24 bg-gray-50 rounded-lg overflow-hidden grid place-items-center">
                <Image
                  src={`/api/steam/icon?name=${encodeURIComponent(
                    toMarketHashName(weapon, skin, wear as WearEN)
                  )}&size=256x256`}
                  alt={`${weapon} | ${skin} (${wear})`}
                  width={256}
                  height={256}
                  className="object-contain w-full h-full"
                  unoptimized
                />
              </div>
              <div>
                <div className="font-semibold">{weapon}</div>
                <div className="text-sm text-gray-600">
                  {skin} • {wear ? WEAR_LABEL_DE[wear as WearEN] : ""}
                </div>
              </div>
            </div>

            {/* Tabelle */}
            <div className="overflow-x-auto border border-gray-200 rounded-2xl bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-6 py-3 text-left">Marktplatz</th>
                    <th className="px-6 py-3 text-left">Gebühr</th>
                    <th className="px-6 py-3 text-left">Preis</th>
                    <th className="px-6 py-3 text-left">Trend (7d)</th>
                    <th className="px-6 py-3 text-left">Aktion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((r) => {
                    const up = r.trend7d.startsWith("+");
                    return (
                      <tr key={r.marketplace} className="hover:bg-gray-50">
                        <td className="px-6 py-3">{r.marketplace}</td>
                        <td className="px-6 py-3">{r.fee}</td>
                        <td className="px-6 py-3 font-medium">
                          {r.finalPrice.toFixed(2)} {r.currency}
                        </td>
                        <td className={`px-6 py-3 font-medium ${up ? "text-emerald-600" : "text-rose-600"}`}>
                          {r.trend7d}
                        </td>
                        <td className="px-6 py-3">
                          <a
                            href={r.url}
                            target="_blank"
                            className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-100"
                          >
                            Öffnen
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

        {/* Leerer Zustand nach Suche */}
        {rows && rows.length === 0 && !error && (
          <div className="mt-4 text-sm text-gray-600">Keine Ergebnisse gefunden.</div>
        )}
      </section>
    </main>
  );
}