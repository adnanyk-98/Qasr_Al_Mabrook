import assert from "node:assert/strict";
import test from "node:test";

import { createPublicPageMetadata, getLocalizedPageMetadataState } from "@/lib/seo";

test("About Us omits alternate-language URLs when either exact translation is unavailable", () => {
  const englishPage = { hasExactLocaleTranslation: false };
  const arabicPage = { hasExactLocaleTranslation: false };

  assert.deepEqual(getLocalizedPageMetadataState(englishPage, arabicPage), {
    hasExactLocaleTranslation: false,
    hasAlternate: false,
    shouldNoindex: true,
  });
  assert.equal(
    getLocalizedPageMetadataState({ hasExactLocaleTranslation: true }, arabicPage)
      .hasAlternate,
    false,
  );

  for (const locale of ["en", "ar"] as const) {
    const metadata = createPublicPageMetadata({
      locale,
      path: "/about-us",
      title: locale === "en" ? "About Us" : "من نحن",
      hasAlternate: getLocalizedPageMetadataState(englishPage, arabicPage).hasAlternate,
    });

    assert.equal(
      metadata.alternates?.canonical,
      `https://www.qasralmabrook.com/${locale}/about-us`,
    );
    assert.equal(metadata.alternates?.languages, undefined);
    assert.equal(
      getLocalizedPageMetadataState(englishPage, arabicPage).shouldNoindex,
      true,
    );
  }
});

test("About Us emits reciprocal alternate URLs when both exact translations exist", () => {
  const englishPage = { hasExactLocaleTranslation: true };
  const arabicPage = { hasExactLocaleTranslation: true };

  assert.deepEqual(getLocalizedPageMetadataState(englishPage, arabicPage), {
    hasExactLocaleTranslation: true,
    hasAlternate: true,
    shouldNoindex: false,
  });

  const metadata = createPublicPageMetadata({
    locale: "en",
    path: "/about-us",
    title: "About Us",
    hasAlternate: getLocalizedPageMetadataState(englishPage, arabicPage).hasAlternate,
  });

  assert.equal(
    metadata.alternates?.languages?.en,
    "https://www.qasralmabrook.com/en/about-us",
  );
  assert.equal(
    metadata.alternates?.languages?.ar,
    "https://www.qasralmabrook.com/ar/about-us",
  );
});
