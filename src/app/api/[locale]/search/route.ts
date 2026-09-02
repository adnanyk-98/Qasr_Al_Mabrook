import { NextResponse } from "next/server";

import { locales, type Locale } from "@/lib/locales";
import { searchPublishedProductsAutocomplete } from "@/server/repositories/public-catalog";

export async function GET(request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }

  const query = new URL(request.url).searchParams.get("q") ?? "";
  const results = await searchPublishedProductsAutocomplete(locale as Locale, query);
  return NextResponse.json({ results }, { headers: { "Cache-Control": "no-store" } });
}
