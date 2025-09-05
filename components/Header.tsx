// components/Header.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import CompassLogo from "./CompassLogo";

const TABS = [
  { href: "/", label: "Start" },
  { href: "/compare", label: "Vergleichstool" },
  // { href: "/analytics", label: "Analysen" },
  // { href: "/faq", label: "FAQ" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="group flex items-center gap-3">
  <div>
    <CompassLogo size={36} />
  </div>
  <span className="select-none text-base font-semibold tracking-tight text-gray-900">
    SkinCompass
  </span>
</Link>

        {/* Tabs */}
        <nav className="hidden items-center gap-2 md:flex">
          {TABS.map((t) => {
            const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={[
                  "relative rounded-md px-3 py-2 text-sm font-medium transition",
                  active
                    ? "text-gray-900 bg-gray-100"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                  "after:pointer-events-none after:absolute after:left-1/2 after:-translate-x-1/2 after:-bottom-1.5 after:h-0.5 after:rounded-full after:bg-gradient-to-r after:from-gray-900 after:to-gray-600 after:transition-all",
                  active ? "after:w-3/4" : "after:w-0 hover:after:w-2/3",
                ].join(" ")}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile Quick-Action */}
        <nav className="md:hidden">
          <Link
            href="/compare"
            className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            Vergleichstool
          </Link>
        </nav>
      </div>
    </header>
  );
}