"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ANALYTICS_CONSENT_EVENT,
  ANALYTICS_CONSENT_STORAGE_KEY,
  type AnalyticsConsentStatus,
  notifyAnalyticsConsentUpdated,
  readAnalyticsConsent,
  writeAnalyticsConsent,
} from "@/lib/analytics-consent";

export default function AnalyticsConsentBanner() {
  const [consent, setConsent] = useState<AnalyticsConsentStatus | null>(null);

  useEffect(() => {
    const syncConsent = () => {
      setConsent(readAnalyticsConsent());
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === ANALYTICS_CONSENT_STORAGE_KEY) {
        syncConsent();
      }
    };

    syncConsent();
    window.addEventListener("storage", handleStorage);
    window.addEventListener(ANALYTICS_CONSENT_EVENT, syncConsent);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(ANALYTICS_CONSENT_EVENT, syncConsent);
    };
  }, []);

  const saveConsent = (value: AnalyticsConsentStatus) => {
    writeAnalyticsConsent(value);
    setConsent(value);
    notifyAnalyticsConsentUpdated();
  };

  if (consent !== null) {
    return null;
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 rounded-lg border border-border bg-card p-4 shadow-lg md:left-auto md:right-6 md:max-w-lg">
      <p className="text-sm text-foreground">
        Wir verwenden Google Analytics, um die Nutzung der Website zu messen. Aktivierung nur nach deiner
        Einwilligung.
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        Details findest du in unserer{" "}
        <Link className="underline hover:no-underline" href="/datenschutz">
          Datenschutzerklärung
        </Link>
        .
      </p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
          onClick={() => saveConsent("denied")}
        >
          Ablehnen
        </button>
        <button
          type="button"
          className="rounded-md bg-foreground px-3 py-2 text-sm text-background hover:opacity-90"
          onClick={() => saveConsent("granted")}
        >
          Akzeptieren
        </button>
      </div>
    </div>
  );
}
