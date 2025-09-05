"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { WEARS, WEAR_LABEL_DE, type WearEN } from "@/data/wears";

// Liste der Waffen kannst du vorerst statisch halten oder aus deiner alten Quelle übernehmen
const WEAPONS = [
  "AK-47", "M4A4", "M4A1-S", "AWP", "Desert Eagle", "Glock-18",
  "USP-S", "P250", "Five-SeveN", "Tec-9", "MP9", "MP7", "P90",
  "UMP-45", "MAC-10", "Galil AR", "FAMAS", "SG 553", "AUG",
  "SCAR-20", "G3SG1", "Nova", "XM1014", "MAG-7", "Sawed-Off",
  "CZ75-Auto", "R8 Revolver", "SSG 08", "Dual Berettas", "Negev", "M249"
];

type PriceRow = {
  marketplace: string;
  fee: string;
  currency: string;
  finalPrice: number;
  trend7d: string;
  url: string;
};

export default function ComparePage() {
  const [weapon, setWeapon] = useState<string>("");
  const [skin, setSkin] = useState<string>("");
  const [wear, setWear] = useState<WearEN | "">("");

  const [skinOptions, setSkinOptions] = useState<string[]>([]);
  const [loadingSkins, setLoadingSkins] = useState(false);

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<PriceRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Wenn Waffe gewählt → Skins live laden
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
        const res = await fetch(`/api/steam/skins?weapon=${encodeURIComponent(weapon)}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (res.ok) {
          setSkinOptions(data.skins ?? []);
        } else {
          setSkinOptions([]);
        }
      } catch {
        setSkinOptions([]);
      } finally {
        setLoadingSkins(false);
      }
    })();
  }, [weapon]);

  const wearsForSelection = useMemo(() => (skin ? WEARS : []), [skin]);

  async function fetchPrices() {
    if (!weapon || !skin || !wear) return;
    try {
      setLoading(true);
      setError(null);
      setRows(null);

      const q = new URLSearchParams({ weapon, skin, wear }).toString();
      const res = await fetch(`/api/prices?${q}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Preise konnten nicht geladen werden.");
      const data = await res.json();
      setRows(data.rows as PriceRow[]);
    } catch (e: any) {
      setError(e?.message || "Unerwarteter Fehler.");
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
        Wähle <strong>Waffe</strong>, <strong>Skin</strong> und <strong>Zustand</strong>.
        Wir zeigen Endpreise inkl. Gebühren &amp; Währungsumrechnung.
      </p>

      {/* Auswahl */}
      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {/* Waffe */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Waffe</label>
          <select
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
            value={weapon}
            onChange={(e) => setWeapon(e.target.value)}
          >
            <option value="">Bitte wählen…</option>
            {WEAPONS.map((w) => (
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
            onChange={(e) => setSkin(e.target.value)}
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
            onChange={(e) => setWear(e.target.value as WearEN)}
            disabled={!skin}
          >
            <option value="">{skin ? "Bitte wählen…" : "Zuerst Skin wählen"}</option>
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

      {/* Ergebnisse (wie gehabt) ... */}
    </main>
  );
}