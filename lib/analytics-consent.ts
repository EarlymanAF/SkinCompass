export type AnalyticsConsentStatus = "granted" | "denied";

export const ANALYTICS_CONSENT_STORAGE_KEY = "skincompass.analytics_consent";
export const ANALYTICS_CONSENT_EVENT = "analytics-consent-updated";

export function readAnalyticsConsent(): AnalyticsConsentStatus | null {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY);
  return value === "granted" || value === "denied" ? value : null;
}

export function writeAnalyticsConsent(value: AnalyticsConsentStatus): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, value);
}

export function notifyAnalyticsConsentUpdated(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(ANALYTICS_CONSENT_EVENT));
}
