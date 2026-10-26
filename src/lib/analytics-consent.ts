export const ANALYTICS_CONSENT_COOKIE = "qam-analytics-consent";
export const ANALYTICS_CONSENT_MAX_AGE = 60 * 60 * 24 * 365;
export const CLARITY_PROJECT_ID = "z3oo92tnyo";
export const GOOGLE_ANALYTICS_SCRIPT_ID = "qam-google-analytics";
export const GOOGLE_ANALYTICS_SOURCE_SCRIPT_ID = "qam-google-analytics-source";
export const CLARITY_SCRIPT_ID = "qam-clarity-loader";

export type AnalyticsConsent = "accepted" | "rejected" | null;
export type AnalyticsRuntime = {
  gtag?: (...args: unknown[]) => void;
  clarity?: (...args: unknown[]) => void;
};

export function parseAnalyticsConsent(
  cookieHeader: string | null | undefined,
): AnalyticsConsent {
  const cookie = cookieHeader
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ANALYTICS_CONSENT_COOKIE}=`));
  const value = cookie?.slice(ANALYTICS_CONSENT_COOKIE.length + 1);

  return value === "accepted" || value === "rejected" ? value : null;
}

export function isCanonicalProductionHost(host: string | null | undefined): boolean {
  const normalizedHost = host
    ?.split(",", 1)[0]
    .trim()
    .toLowerCase()
    .replace(/:443$/, "");
  return normalizedHost === "www.qasralmabrook.com";
}

export function getAnalyticsScriptPlan(
  consent: AnalyticsConsent,
  canonicalProductionHost: boolean,
  googleAnalyticsConfigured: boolean,
) {
  const enabled = consent === "accepted";
  return {
    googleAnalytics: enabled && googleAnalyticsConfigured,
    clarity: enabled && canonicalProductionHost,
  };
}

export function applyAnalyticsConsent(
  consent: Exclude<AnalyticsConsent, null>,
  runtime: AnalyticsRuntime = window,
): void {
  const granted = consent === "accepted";
  runtime.gtag?.("consent", "update", {
    analytics_storage: granted ? "granted" : "denied",
    ad_storage: "denied",
  });

  if (runtime.clarity) {
    runtime.clarity("consentv2", {
      ad_Storage: "denied",
      analytics_Storage: granted ? "granted" : "denied",
    });
    if (!granted) runtime.clarity("consent", false);
  }
}

export function saveAnalyticsConsent(consent: Exclude<AnalyticsConsent, null>): void {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${ANALYTICS_CONSENT_COOKIE}=${consent}; Path=/; Max-Age=${ANALYTICS_CONSENT_MAX_AGE}; SameSite=Lax${secure}`;
}

export function hasAnalyticsConsent(): boolean {
  return parseAnalyticsConsent(document.cookie) === "accepted";
}
