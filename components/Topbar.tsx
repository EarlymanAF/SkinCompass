"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NAV_ITEMS } from "@/lib/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/": "Übersicht",
  "/compare": "Vergleichsportal",
  "/calendar": "Roadmap",
  "/messages": "Nachrichten",
  "/list": "Inventar",
  "/settings": "Einstellungen",
  "/landing": "Landing",
};

export default function Topbar() {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "Dashboard";
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 md:px-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
            SkinCompass
          </p>
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-gray-500 shadow-card hover:text-gray-900 transition"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Profilmenü öffnen"
            >
              <UserCircle size={22} />
            </button>
            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-3 w-44 rounded-card border border-border bg-surface shadow-lg"
              >
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-semibold text-foreground">Mein Konto</p>
                  <p className="text-xs text-muted">info@skincompass.de</p>
                </div>
                <div className="py-2">
                  <Link
                    href="/settings"
                    role="menuitem"
                    className="block px-4 py-2 text-sm text-foreground hover:bg-gray-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    Einstellungen
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-amber-200 bg-amber-50/90">
        <p className="mx-auto max-w-7xl px-6 py-2 text-xs font-semibold tracking-[0.08em] text-amber-900 md:px-8">
          WORK IN PROGRESS: SkinCompass ist aktuell eine Beta. Funktionen, Design und Inhalte werden laufend erweitert.
        </p>
      </div>

      <div className="md:hidden border-t border-border bg-surface">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2">
          {NAV_ITEMS.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                aria-label={item.label}
                className={[
                  "flex h-10 w-10 items-center justify-center rounded-xl transition",
                  active
                    ? "accent-gradient bg-[length:200%_200%] animate-gradient-shift text-slate-900 shadow-active ring-1 ring-slate-900/70"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-900",
                ].join(" ")}
              >
                <Icon size={18} />
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
