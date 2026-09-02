import { NextResponse } from "next/server";

import { locales, type Locale } from "@/lib/locales";
import { getPublishedProductsAutocompleteIndex } from "@/server/repositories/public-catalog";

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }

  const results = await getPublishedProductsAutocompleteIndex(locale as Locale);
  return NextResponse.json({ results }, { headers: { "Cache-Control": "no-store" } });
}