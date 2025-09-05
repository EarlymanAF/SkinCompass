// components/SkinSearch.tsx
"use client";

import { useEffect, useRef, useState } from "react";

type Result = { name: string; icon: string | null };

type Props = {
  onSelect: (hashName: string) => void;
  placeholder?: string;
};

export default function SkinSearch({ onSelect, placeholder = "Skin suchen (z. B. 'AK-47 Redline')" }: Props) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!q || q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setLoading(true);
      try {
        const res = await fetch(`/api/steam/search?q=${encodeURIComponent(q)}&count=12`, {
          signal: ac.signal,
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Suche fehlgeschlagen");
        const data = await res.json();
        setResults(data.results || []);
        setOpen(true);
      } catch {
        // ignore UI errors
      } finally {
        setLoading(false);
        abortRef.current = null;
      }
    }, 250); // Debounce 250ms

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q]);

  function handlePick(name: string) {
    setQ(name);
    setOpen(false);
    onSelect(name);
  }

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700">Skin (via Steam-Suche)</label>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
        className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
        placeholder={placeholder}
        autoComplete="off"
      />
      {loading && (
        <div className="absolute right-3 top-[38px] h-4 w-4 animate-spin border-2 border-gray-300 border-t-gray-700 rounded-full" />
      )}

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
                  {r.icon ? (
                    // Direkt Icon vom Steam-CDN
                    <img src={r.icon} alt="" className="h-full w-full object-contain" />
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