export default function ListPage() {
  const topPositions = [
    { name: "AK-47 | Fire Serpent", wear: "Fabrikneu", floatValue: "0.03", value: "€ 12.450" },
    { name: "AWP | Dragon Lore", wear: "Minimal Wear", floatValue: "0.11", value: "€ 9.870" },
    { name: "Karambit | Doppler", wear: "Fabrikneu", floatValue: "0.02", value: "€ 8.240" },
  ];

  const riskPositions = [
    { name: "AK-47 | Vulcan", wear: "Field-Tested", floatValue: "0.36", delta: "-6.2%" },
    { name: "USP-S | Kill Confirmed", wear: "Well-Worn", floatValue: "0.43", delta: "-4.8%" },
    { name: "M4A1-S | Printstream", wear: "Field-Tested", floatValue: "0.32", delta: "-3.9%" },
  ];

  const recentChanges = [
    { title: "Neuer Preisalarm für AWP | Dragon Lore", time: "Heute, 08:55" },
    { title: "Inventarwert +1.4% seit gestern", time: "Heute, 07:10" },
    { title: "2 Positionen mit Trendwechsel erkannt", time: "Gestern, 19:20" },
  ];

  return (
    <main className="mx-auto max-w-7xl px-6 md:px-8 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Inventar</h2>
          <p className="mt-2 text-secondary">
            Übersicht über Top-Positionen, Risikopositionen und jüngste Portfolio-Änderungen.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <button className="rounded-button border border-border bg-white px-4 py-2 text-sm font-medium text-foreground shadow-card">
            Filter
          </button>
          <button className="rounded-button bg-foreground px-4 py-2 text-sm font-medium text-white shadow-card">
            Import
          </button>
        </div>
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          { label: "Gesamtwert", value: "€ 86.000", change: "+34%" },
          { label: "Skins", value: "124", change: "+6" },
          { label: "Seltene Items", value: "18", change: "+2" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-[24px] border border-border bg-surface p-5 shadow-card">
            <p className="text-sm text-secondary">{stat.label}</p>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-semibold">{stat.value}</span>
              <span className="text-sm font-medium text-emerald-600">{stat.change}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <article className="rounded-[24px] border border-border bg-surface p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Top Positionen</h3>
            <span className="text-sm text-secondary">Nach Wert</span>
          </div>
          <div className="mt-4 space-y-3">
            {topPositions.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white/80 p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.name}</p>
                  <p className="text-xs text-muted">
                    Wear: {item.wear} · Float: {item.floatValue}
                  </p>
                </div>
                <p className="text-sm font-semibold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[24px] border border-border bg-surface p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Risikopositionen</h3>
            <span className="text-sm text-secondary">Trend 7d</span>
          </div>
          <div className="mt-4 space-y-3">
            {riskPositions.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white/80 p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.name}</p>
                  <p className="text-xs text-muted">
                    Wear: {item.wear} · Float: {item.floatValue}
                  </p>
                </div>
                <p className="text-sm font-semibold text-rose-600">{item.delta}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="mt-6 rounded-[24px] border border-border bg-surface p-6 shadow-card">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Letzte Änderungen</h3>
          <span className="text-sm text-secondary">Aktivität</span>
        </div>
        <div className="mt-4 space-y-3">
          {recentChanges.map((event) => (
            <div
              key={event.title}
              className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white/80 p-4"
            >
              <p className="text-sm text-foreground">{event.title}</p>
              <p className="text-xs text-muted">{event.time}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
