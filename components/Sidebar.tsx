"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import CompassLogo from "@/components/CompassLogo";
import { NAV_ITEMS } from "@/lib/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="relative hidden md:flex w-24 lg:w-28 shrink-0 border-r border-border bg-surface sticky top-0 h-screen self-start">
      <div className="absolute inset-0 sidebar-gradient opacity-70 animate-float" aria-hidden="true" />
      <div className="relative z-10 flex h-full flex-col items-center gap-8 px-3 py-6">
        <Link
          href="/"
          className="group flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-card"
          aria-label="SkinCompass Startseite"
        >
          <CompassLogo size={34} />
        </Link>

        <nav className="flex flex-col items-center gap-4">
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
                  className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200/70 bg-white/60 text-slate-400 opacity-60"
                >
                  <Icon size={20} />
                  <span className="absolute -right-1 -top-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                    Bald
                  </span>
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
                  "relative flex h-12 w-12 items-center justify-center rounded-2xl transition",
                  active
                    ? "accent-gradient bg-[length:200%_200%] animate-gradient-shift text-slate-900 shadow-active ring-1 ring-slate-900/70 before:absolute before:-left-2 before:top-1/2 before:h-8 before:w-1 before:-translate-y-1/2 before:rounded-full before:bg-gradient-to-b before:from-indigo-500 before:to-violet-500"
                    : "text-slate-700 hover:bg-white/80 hover:text-slate-900",
                ].join(" ")}
              >
                <Icon size={20} />
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
