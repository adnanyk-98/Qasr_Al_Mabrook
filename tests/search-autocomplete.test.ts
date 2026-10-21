import assert from "node:assert/strict";
import { test } from "node:test";

import { localePath } from "@/lib/locales";
import { mapAutocompleteRows } from "@/lib/public-catalog-mapping";
import { filterAutocompleteResults } from "@/lib/public-search";

test("autocomplete returns no results for an empty query", () => {
  assert.deepEqual(filterAutocompleteResults([], "   "), []);
});

test("autocomplete maps localized published rows and removes duplicate join results", () => {
  const rows = [
    {
      productId: "tape-5",
      slug: "5m-measuring-tape",
      sku: "TAPE-5",
      productName: "5M Measuring Tape",
      categorySlug: "measuring-tapes",
      categoryName: "Measuring Tapes",
      primaryImageUrl: "/tape.jpg",
      primaryImageAltEn: "Measuring tape",
      primaryImageAltAr: "شريط قياس",
    },
    {
      productId: "tape-5",
      slug: "5m-measuring-tape",
      sku: "TAPE-5",
      productName: "5M Measuring Tape",
      categorySlug: "measuring-tapes",
      categoryName: "Measuring Tapes",
      primaryImageUrl: "/tape.jpg",
      primaryImageAltEn: "Measuring tape",
      primaryImageAltAr: "شريط قياس",
    },
    {
      productId: "tape-7",
      slug: "7m-measuring-tape",
      sku: "TAPE-7",
      productName: null,
      categorySlug: "measuring-tapes",
      categoryName: null,
      primaryImageUrl: null,
      primaryImageAltEn: null,
      primaryImageAltAr: null,
    },
  ];
  const english = mapAutocompleteRows(rows, "en");
  const arabic = mapAutocompleteRows(rows, "ar");

  assert.equal(english.length, 2);
  assert.equal(english[0].name, "5M Measuring Tape");
  assert.equal(english[0].categoryName, "Measuring Tapes");
  assert.equal(english[0].imageAlt, "Measuring tape");
  assert.equal(arabic[0].imageAlt, "شريط قياس");
  assert.equal(arabic[1].name, "7m-measuring-tape");
  assert.equal(arabic[1].categoryName, "measuring-tapes");
  assert.equal(
    localePath("en", `/products/${english[0].slug}`),
    "/en/products/5m-measuring-tape",
  );
  assert.equal(
    localePath("ar", `/products/${arabic[0].slug}`),
    "/ar/products/5m-measuring-tape",
  );
});

test("local autocomplete filtering preserves matching, order, limit, and no-results behavior", () => {
  const results = [
    {
      id: "1",
      slug: "5m-measuring-tape",
      name: "5M Measuring Tape",
      categoryName: "Tools",
      sku: "TAPE-5",
      imageUrl: null,
      imageAlt: null,
    },
    {
      id: "2",
      slug: "adivasi-oil",
      name: "Adivasi Oil",
      categoryName: "Personal Care",
      sku: "OIL-1",
      imageUrl: null,
      imageAlt: null,
    },
    {
      id: "3",
      slug: "7m-measuring-tape",
      name: "7M Measuring Tape",
      categoryName: "Tools",
      sku: "TAPE-7",
      imageUrl: null,
      imageAlt: null,
    },
  ];

  assert.deepEqual(
    filterAutocompleteResults(results, "TAPE", 1).map((result) => result.id),
    ["1"],
  );
  assert.deepEqual(
    filterAutocompleteResults(results, "oil").map((result) => result.id),
    ["2"],
  );
  assert.deepEqual(filterAutocompleteResults(results, "missing"), []);
});
