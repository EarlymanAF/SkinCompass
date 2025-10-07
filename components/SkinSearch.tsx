// components/SkinSearch.tsx
"use client";

import { useState } from "react";
import SKINS from "@/data/skins.json";

type SkinItem = { weapon: string; name: string; icon?: string | null };
const SKINS_TYPED = SKINS as SkinItem[];

type Result = { weapon: string; name: string; icon?: string | null };

type Props = {
  onSelect: (hashName: string) => void;
  placeholder?: string;
};

export default function SkinSearch({ onSelect, placeholder = "Skin suchen (z. B. 'AK-47 Redline')" }: Props) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const results = q.length >= 2
    ? SKINS_TYPED.filter((skin) => skin.name.toLowerCase().includes(q.toLowerCase())).slice(0, 12)
    : [];

  function handlePick(name: string) {
    setQ(name);
    setOpen(false);
    onSelect(name);
  }

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700">Skin (lokal geladen)</label>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
        className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
        placeholder={placeholder}
        autoComplete="off"
      />

      {open && results.length > 0 && (
        <div className="absolute z-10 mt-2 w-full rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
          <ul className="max-h-80 overflow-auto divide-y divide-gray-100">
            {results.map((r) => (
              <li
                key={r.name}
                className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent input blur before click
                  handlePick(r.name);
                }}
              >
                <div className="h-8 w-8 bg-gray-100 rounded overflow-hidden grid place-items-center">
                  {r.icon ?? null ? (
                    // Direkt Icon vom Steam-CDN
                    <img src={r.icon ?? ""} alt="" className="h-full w-full object-contain" />
                  ) : (
                    <div className="h-6 w-6 bg-gray-200 rounded" />
                  )}
                </div>
                <span className="text-sm text-gray-800">{r.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}