"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/": "Vision",
  "/impressum": "Impressum",
  "/datenschutz": "Datenschutz",
};

export default function Topbar() {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "SkinCompass";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 md:px-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
            SkinCompass
          </p>
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        </div>
        <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-emerald-700">
          Early Access
        </div>
      </div>

      <div className="border-t border-amber-200 bg-amber-50/90">
        <p className="mx-auto max-w-7xl px-6 py-2 text-xs font-semibold tracking-[0.08em] text-amber-900 md:px-8">
          WORK IN PROGRESS: Start mit CS-Skins, danach Erweiterung auf weitere digitale Märkte.
        </p>
      </div>

      <div className="md:hidden border-t border-border bg-surface">
        <nav className="mx-auto flex max-w-7xl items-center justify-center px-4 py-2">
          {NAV_ITEMS.map((item) => {
            const isEnabled = item.enabled !== false;
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;

            if (!isEnabled) {
              return (
                <div
                  key={item.href}
                  title={`${item.label} (in Arbeit)`}
                  aria-label={`${item.label} (in Arbeit)`}
                  aria-disabled="true"
                  className="mx-1 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/70 bg-white/60 text-slate-400 opacity-60"
                >
                  <Icon size={18} />
                </div>
              );
            }

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
