"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ANALYTICS_CONSENT_EVENT,
  ANALYTICS_CONSENT_STORAGE_KEY,
  readAnalyticsConsent,
} from "@/lib/analytics-consent";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const [isConsentGranted, setIsConsentGranted] = useState(false);
  const isFirstPageView = useRef(true);

  useEffect(() => {
    const syncConsent = () => {
      setIsConsentGranted(readAnalyticsConsent() === "granted");
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

  useEffect(() => {
    if (!GA_MEASUREMENT_ID || !isConsentGranted || !window.gtag) {
      return;
    }

    if (isFirstPageView.current) {
      isFirstPageView.current = false;
      return;
    }

    const search = window.location.search;
    const pagePath = `${pathname}${search}`;

    window.gtag("event", "page_view", {
      page_title: document.title,
      page_location: window.location.href,
      page_path: pagePath,
    });
  }, [isConsentGranted, pathname]);

  if (!GA_MEASUREMENT_ID || !isConsentGranted) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
          gtag('event', 'page_view', {
            page_title: document.title,
            page_location: window.location.href,
            page_path: window.location.pathname + window.location.search
          });
        `}
      </Script>
    </>
  );
}
