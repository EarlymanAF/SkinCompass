"use client";

import Link from "next/link";
import { useState } from "react";

export default function SettingsPage() {
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [marketUpdates, setMarketUpdates] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);

  return (
    <main className="mx-auto max-w-7xl px-6 md:px-8 py-8 space-y-6">
      <section className="rounded-[24px] border border-border bg-surface p-6 shadow-card md:p-8">
        <h1 className="text-2xl font-semibold text-foreground md:text-3xl">Einstellungen</h1>
        <p className="mt-2 max-w-3xl text-secondary">
          Verwalte Konto, Benachrichtigungen und Datenschutz zentral an einer Stelle.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-[24px] border border-border bg-surface p-6 shadow-card">
          <h2 className="text-lg font-semibold text-foreground">Konto</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-2xl border border-gray-100 bg-white/80 p-4">
              <p className="text-muted">E-Mail</p>
              <p className="font-medium text-foreground">investor@skincompass.de</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white/80 p-4">
              <p className="text-muted">Plan</p>
              <p className="font-medium text-foreground">Starter (Early Access)</p>
            </div>
            <button
              type="button"
              className="rounded-button border border-border bg-white px-4 py-2 font-medium text-foreground hover:bg-gray-50"
            >
              Konto-Daten aktualisieren
            </button>
          </div>
        </article>

        <article className="rounded-[24px] border border-border bg-surface p-6 shadow-card">
          <h2 className="text-lg font-semibold text-foreground">Benachrichtigungen</h2>
          <div className="mt-4 space-y-3 text-sm">
            <ToggleRow
              label="Preisalarm-Benachrichtigungen"
              description="Meldung, wenn ein beobachteter Preisbereich erreicht wird."
              enabled={priceAlerts}
              onToggle={() => setPriceAlerts((prev) => !prev)}
            />
            <ToggleRow
              label="Markt-Updates"
              description="Hinweise bei auffälligen Trends und hoher Volatilität."
              enabled={marketUpdates}
              onToggle={() => setMarketUpdates((prev) => !prev)}
            />
            <ToggleRow
              label="Wochenzusammenfassung"
              description="Kompakter Rückblick auf Wertentwicklung und wichtige Änderungen."
              enabled={weeklySummary}
              onToggle={() => setWeeklySummary((prev) => !prev)}
            />
          </div>
        </article>
      </section>

      <section className="rounded-[24px] border border-border bg-surface p-6 shadow-card">
        <h2 className="text-lg font-semibold text-foreground">Daten &amp; Privacy</h2>
        <p className="mt-2 text-sm text-secondary">
          Transparenz über Datennutzung und rechtliche Informationen.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/datenschutz"
            className="rounded-button border border-border bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-gray-50"
          >
            Datenschutz
          </Link>
          <Link
            href="/impressum"
            className="rounded-button border border-border bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-gray-50"
          >
            Impressum
          </Link>
        </div>
      </section>
    </main>
  );
}

function ToggleRow({
  label,
  description,
  enabled,
  onToggle,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white/80 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">{label}</p>
          <p className="mt-1 text-xs text-muted">{description}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={onToggle}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
            enabled ? "bg-indigo-500" : "bg-slate-300"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
              enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
