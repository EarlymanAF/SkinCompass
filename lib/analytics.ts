import { ANALYTICS_CONSENT_STORAGE_KEY } from "@/lib/analytics-consent";

type AnalyticsValue = string | number | boolean;
type AnalyticsParams = Record<string, AnalyticsValue | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY) === "granted";
}

export function trackEvent(eventName: string, params: AnalyticsParams = {}): void {
  if (typeof window === "undefined" || !window.gtag || !hasAnalyticsConsent()) {
    return;
  }

  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined),
  ) as Record<string, AnalyticsValue>;

  window.gtag("event", eventName, cleanParams);
}
