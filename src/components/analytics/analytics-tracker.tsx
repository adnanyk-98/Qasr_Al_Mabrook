"use client";

import { useEffect, useRef } from "react";

import { trackEvent, type AnalyticsEventName, type AnalyticsEventParams } from "@/lib/analytics";

export function AnalyticsTracker({ event, params }: { event: AnalyticsEventName; params: AnalyticsEventParams }) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    trackEvent(event, params);
  }, [event, params]);

  return null;
}
