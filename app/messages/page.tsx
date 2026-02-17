import Link from "next/link";
import { MESSAGE_FEED, type MessageKind } from "@/lib/content/messages";

const KIND_LABEL: Record<MessageKind, string> = {
  product: "Produkt-Update",
  market: "Markt-Hinweis",
};

export default function MessagesPage() {
  const systemMessages = MESSAGE_FEED.filter((entry) => entry.kind === "product");
  const marketMessages = MESSAGE_FEED.filter((entry) => entry.kind === "market");

  return (
    <main className="mx-auto max-w-7xl px-6 md:px-8 py-8">
      <section className="rounded-[24px] border border-border bg-surface p-6 shadow-card md:p-8">
        <h1 className="text-2xl font-semibold text-foreground md:text-3xl">Alerts &amp; Updates</h1>
        <p className="mt-2 max-w-3xl text-secondary">
          Hier findest du relevante Produktneuigkeiten und Markt-Hinweise in einem kompakten Feed.
        </p>
        <Link
          href="/settings"
          className="mt-4 inline-flex rounded-button border border-border bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-gray-50"
        >
          Alert-Frequenz einstellen
        </Link>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <article className="rounded-[24px] border border-border bg-surface p-6 shadow-card">
          <h2 className="text-lg font-semibold text-foreground">System &amp; Produkt-Updates</h2>
          <div className="mt-4 space-y-4">
            {systemMessages.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-border bg-white/80 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">{entry.title}</p>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                      entry.state === "new" ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {entry.state === "new" ? "Neu" : "Gelesen"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-secondary">{entry.summary}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-muted">
                  <span>{KIND_LABEL[entry.kind]}</span>
                  <span>{entry.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[24px] border border-border bg-surface p-6 shadow-card">
          <h2 className="text-lg font-semibold text-foreground">Preis- und Markt-Hinweise</h2>
          <div className="mt-4 space-y-4">
            {marketMessages.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-border bg-white/80 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">{entry.title}</p>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                      entry.state === "new" ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {entry.state === "new" ? "Neu" : "Gelesen"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-secondary">{entry.summary}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-muted">
                  <span>{KIND_LABEL[entry.kind]}</span>
                  <span>{entry.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
