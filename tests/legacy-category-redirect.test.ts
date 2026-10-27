import assert from "node:assert/strict";
import test from "node:test";

import { legacyCategoryRedirects } from "@/lib/legacy-category-redirects";
import { blogArticles } from "@/lib/blog";

test("legacy Cloth Piece category URLs redirect permanently without changing locale", () => {
  assert.deepEqual(legacyCategoryRedirects, [
    {
      source: "/en/categories/cloth-piece",
      destination: "/en/categories/fabrics-textiles",
      permanent: true,
    },
    {
      source: "/ar/categories/cloth-piece",
      destination: "/ar/categories/fabrics-textiles",
      permanent: true,
    },
  ]);
});

test("repository-controlled localized blog links use the current category slug", () => {
  const categoryLinks = blogArticles.flatMap((article) =>
    (["en", "ar"] as const).flatMap((locale) =>
      article.body[locale].flatMap((html) =>
        [...html.matchAll(/href="([^"]*\/categories\/[^"]+)"/g)].map(
          ([, href]) => href,
        ),
      ),
    ),
  );

  assert.ok(categoryLinks.includes("/en/categories/fabrics-textiles"));
  assert.ok(categoryLinks.includes("/ar/categories/fabrics-textiles"));
  assert.equal(
    categoryLinks.some((href) => /\/categories\/cloth-piece(?:[/?#]|$)/.test(href)),
    false,
  );
});
