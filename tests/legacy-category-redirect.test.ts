import assert from "node:assert/strict";
import test from "node:test";

import { blogArticles } from "@/lib/blog";
import nextConfig from "../next.config";

test("legacy category URLs redirect permanently to the current localized category", async () => {
  const redirects = (await nextConfig.redirects?.()) ?? [];
  assert.deepEqual(redirects, [
    {
      source: "/en/categories/cloth-piece",
      destination: "/en/categories/fabrics-textiles",
      permanent: true,
    },
    {
      source: "/en/categories/pajama",
      destination: "/en/categories/mens-bottom-wear",
      permanent: true,
    },
    {
      source: "/en/categories/adivasi-oil",
      destination: "/en/categories/hair-oils",
      permanent: true,
    },
    {
      source: "/ar/categories/cloth-piece",
      destination: "/ar/categories/fabrics-textiles",
      permanent: true,
    },
    {
      source: "/ar/categories/pajama",
      destination: "/ar/categories/mens-bottom-wear",
      permanent: true,
    },
    {
      source: "/ar/categories/adivasi-oil",
      destination: "/ar/categories/hair-oils",
      permanent: true,
    },
  ]);
});

test("affected localized blog articles link directly to the replacement categories", () => {
  const expectedLinks = [
    ["shopping-guide", "en", "/en/categories/mens-bottom-wear"],
    ["shopping-guide", "ar", "/ar/categories/mens-bottom-wear"],
    ["choosing-everyday-essentials", "en", "/en/categories/mens-bottom-wear"],
    ["choosing-everyday-essentials", "ar", "/ar/categories/mens-bottom-wear"],
    ["pajama-guide", "en", "/en/categories/mens-bottom-wear"],
    ["pajama-guide", "ar", "/ar/categories/mens-bottom-wear"],
    ["adivasi-oil-overview", "en", "/en/categories/hair-oils"],
    ["adivasi-oil-overview", "ar", "/ar/categories/hair-oils"],
  ] as const;

  for (const [slug, locale, target] of expectedLinks) {
    const article = blogArticles.find((entry) => entry.slug === slug);
    assert.ok(article, `Expected repository article ${slug}`);
    const hrefs = article.body[locale].flatMap((html) =>
      [...html.matchAll(/href="([^"]+)"/g)].map(([, href]) => href),
    );

    assert.ok(
      hrefs.includes(target),
      `Expected ${slug} (${locale}) to link directly to ${target}`,
    );
    assert.equal(
      hrefs.some((href) =>
        /\/categories\/(?:pajama|adivasi-oil)(?:[/?#]|$)/.test(href),
      ),
      false,
      `Found a legacy category URL in ${slug} (${locale})`,
    );
  }

  const articleBodies = blogArticles.flatMap((article) => [
    ...article.body.en,
    ...article.body.ar,
  ]);
  assert.ok(
    articleBodies.some((html) =>
      html.includes('href="/en/categories/fabrics-textiles"'),
    ),
  );
  assert.ok(
    articleBodies.some((html) =>
      html.includes('href="/ar/categories/fabrics-textiles"'),
    ),
  );
});
