"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, LogOut, UserCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { NAV_ITEMS } from "@/lib/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/": "Übersicht",
  "/compare": "Vergleichsportal",
  "/calendar": "Roadmap",
  "/messages": "Nachrichten",
  "/list": "Inventar",
  "/settings": "Einstellungen",
  "/landing": "Landing",
  "/login": "Anmeldung",
};

export default function Topbar() {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "Dashboard";
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const isAuthenticated = status === "authenticated" && Boolean(session?.user?.steamId);
  const isAuthLoading = status === "loading";
  const userName = session?.user?.name ?? "Steam Nutzer";
  const userAvatar = session?.user?.image;
  const steamHandle = session?.user?.steamId
    ? `Steam #${session.user.steamId.slice(-6)}`
    : "Nicht angemeldet";

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

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  async function handleLogin() {
    await signIn("steam", { callbackUrl: "/" });
  }

  async function handleLogout() {
    setMenuOpen(false);
    await signOut({ callbackUrl: "/login" });
  }

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
          {!isAuthenticated ? (
            <button
              type="button"
              onClick={handleLogin}
              disabled={isAuthLoading}
              className="inline-flex items-center gap-2 rounded-button bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
            >
              <LogIn size={16} />
              {isAuthLoading ? "Lädt..." : "Anmelden"}
            </button>
          ) : (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-border bg-white text-gray-500 shadow-card transition hover:text-gray-900"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Profilmenü öffnen"
              >
                {userAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={userAvatar} alt={userName} className="h-full w-full object-cover" />
                ) : (
                  <UserCircle size={22} />
                )}
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-3 w-52 rounded-card border border-border bg-surface shadow-lg"
                >
                  <div className="border-b border-border px-4 py-3">
                    <p className="text-sm font-semibold text-foreground">{userName}</p>
                    <p className="text-xs text-muted">{steamHandle}</p>
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
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-gray-50"
                    >
                      <LogOut size={14} />
                      Abmelden
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
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
