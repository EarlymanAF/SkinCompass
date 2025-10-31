// components/SkinSearch.tsx
"use client";

import { useState, useEffect } from "react";

type SkinItem = { weapon: string; name: string; icon?: string | null; wears?: string[]; image?: string | null };

type Props = {
  onSelect: (hashName: string) => void;
  placeholder?: string;
};

// Known wear suffixes (used only for stripping from display names)
const WEAR_SUFFIXES = [
  "Factory New",
  "Minimal Wear",
  "Field-Tested",
  "Well-Worn",
  "Battle-Scarred",
];
const WEAR_SUFFIXES_PAREN = WEAR_SUFFIXES.map((w) => `(${w})`);

// Helper to strip wear suffix and weapon prefix from skin name (e.g., "AK-47 | Redline (Field-Tested)" -> "Redline")
function stripWear(name: string, weapon: string) {
  let strippedName = name;
  for (const w of WEAR_SUFFIXES_PAREN) {
    if (strippedName.endsWith(" " + w)) {
      strippedName = strippedName.slice(0, -1 * (w.length + 1));
      break;
    }
  }
  const prefix = weapon + " | ";
  if (strippedName.startsWith(prefix)) {
    strippedName = strippedName.slice(prefix.length);
  }
  return strippedName;
}

// Helper to extract weapon name from skin item
function getWeaponFromSkin(skin: SkinItem) {
  return skin.weapon;
}

export default function SkinSearch({ onSelect, placeholder = "Skin suchen (z. B. 'AK-47 Redline')" }: Props) {
  // Step 1: Weapon selection
  const [weapons, setWeapons] = useState<string[]>([]);
  const [selectedWeapon, setSelectedWeapon] = useState<string>("");
  // Step 2: Skin selection (without wear)
  const [skins, setSkins] = useState<SkinItem[]>([]);
  const [skinOptions, setSkinOptions] = useState<{ name: string; icon?: string | null; wears?: string[] }[]>([]);
  const [selectedSkin, setSelectedSkin] = useState<string>("");
  // Step 3: Wear selection
  const [selectedWear, setSelectedWear] = useState<string>("");
  const [wearOptions, setWearOptions] = useState<string[]>([]);
  // UI state
  const [loadingSkins, setLoadingSkins] = useState(false);

  // Load weapons from API (authoritative)
  useEffect(() => {
    fetch("/api/steam/skins")
      .then((res) => res.json())
      .then((data: SkinItem[]) => {
        setSkins(data);
        // Derive unique weapons
        const weaponSet = new Set<string>();
        for (const skin of data) {
          weaponSet.add(skin.weapon);
        }
        setWeapons(Array.from(weaponSet).sort());
      })
      .catch((err) => console.error("Fehler beim Laden der Skins:", err));
  }, []);

  // Step 1: Weapon selection handler
  function handleWeaponChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const weapon = e.target.value;
    setSelectedWeapon(weapon);
    setSelectedSkin("");
    setSelectedWear("");
    setSkinOptions([]);
    console.log("Step 1: Selected weapon:", weapon);
    if (!weapon) return;
    setLoadingSkins(true);
    // Load skins for this weapon via API
    fetch(`/api/steam/skins?weapon=${encodeURIComponent(weapon)}`)
      .then((res) => res.json())
      .then((data: SkinItem[]) => {
        // Filter out duplicate skin names (ignoring wear) and strip weapon prefix and wear suffix for display
        const unique: { [name: string]: SkinItem } = {};
        for (const item of data) {
          const baseName = stripWear(item.name, weapon);
          if (!(baseName in unique)) {
            unique[baseName] = { ...item, name: baseName };
          }
        }
        setSkinOptions(Object.values(unique).map(s => ({ name: s.name, icon: s.icon, wears: s.wears })));
        setLoadingSkins(false);
      })
      .catch((err) => {
        setLoadingSkins(false);
        console.error("Fehler beim Laden der Weapon-Skins:", err);
      });
  }

  // Step 2: Skin selection handler
  function handleSkinChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const skin = e.target.value;
    setSelectedSkin(skin);
    setSelectedWear("");
    console.log("Step 2: Selected skin:", skin);
    // Prefer locally stored wears if present
    if (selectedWeapon && skin) {
      const entry = skinOptions.find((s) => s.name === skin);
      const wears = (entry?.wears && entry.wears.length > 0) ? entry.wears : WEAR_SUFFIXES;
      setWearOptions(wears);
    } else {
      setWearOptions(WEAR_SUFFIXES);
    }
  }

  // Step 3: Wear selection handler
  async function handleWearChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const wear = e.target.value;
    setSelectedWear(wear);
    console.log("Step 3: Selected wear:", wear);
    // After wear is selected, call /api/prices
    if (selectedWeapon && selectedSkin && wear) {
      // Compose hash name and call price API with structured params
      const hashName = `${selectedWeapon} | ${selectedSkin} (${wear})`;
      onSelect(hashName);
      try {
        const url = `/api/prices?weapon=${encodeURIComponent(selectedWeapon)}&skin=${encodeURIComponent(selectedSkin)}&wear=${encodeURIComponent(wear)}`;
        console.log("Fetching prices for:", hashName, "URL:", url);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`API request failed with status ${res.status}`);
        const data = await res.json();
        console.log("Price API response:", data);
      } catch (err) {
        console.error("Error fetching price data:", err);
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Step 1: Weapon selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Waffe auswählen</label>
        <select
          className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
          value={selectedWeapon}
          onChange={handleWeaponChange}
        >
          <option value="">-- Waffe wählen --</option>
          {weapons.map((w) => (
            <option key={w} value={w}>{w}</option>
          ))}
        </select>
      </div>
      {/* Step 2: Skin selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Skin auswählen</label>
        <select
          className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
          value={selectedSkin}
          onChange={handleSkinChange}
          disabled={!selectedWeapon || loadingSkins || skinOptions.length === 0}
        >
          <option value="">-- Skin wählen --</option>
          {skinOptions.map((s) => (
            <option key={s.name} value={s.name}>{s.name}</option>
          ))}
        </select>
        {loadingSkins && <div className="text-xs text-gray-400 mt-1">Lade Skins...</div>}
      </div>
      {/* Step 3: Wear selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Wear auswählen</label>
        <select
          className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
          value={selectedWear}
          onChange={handleWearChange}
          disabled={!selectedSkin}
        >
          <option value="">-- Wear wählen --</option>
          {(wearOptions.length > 0 ? wearOptions : WEAR_SUFFIXES).map((w) => (
            <option key={w} value={w}>{w}</option>
          ))}
        </select>
      </div>
    </div>
  );
}