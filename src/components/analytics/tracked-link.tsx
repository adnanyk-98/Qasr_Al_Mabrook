"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

import { trackEvent, type AnalyticsEventName, type AnalyticsEventParams } from "@/lib/analytics";

export function TrackedLink({ event, params, children, onClick, ...props }: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string; event: AnalyticsEventName; params: AnalyticsEventParams; children: ReactNode }) {
  return (
    <Link
      {...props}
      onClick={(eventObject) => {
        trackEvent(event, params);
        onClick?.(eventObject);
      }}
    >
      {children}
    </Link>
  );
}
