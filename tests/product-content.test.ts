import assert from "node:assert/strict";
import test from "node:test";

import { formatProductFaqEntries, parseProductApplications, parseProductFaqEntries } from "@/lib/product-content";
import { buildCategorySeoDescription, createFaqStructuredData, createOrganizationStructuredData, createProductMetadata, buildProductSeoTitle } from "@/lib/seo";

test("product FAQ entries parse and format without inventing content", () => {
  const entries = parseProductFaqEntries("What is included? :: The product shown in the catalogue.");

  assert.deepEqual(entries, [{ question: "What is included?", answer: "The product shown in the catalogue." }]);
  assert.equal(formatProductFaqEntries(entries), "What is included? :: The product shown in the catalogue.");
});

test("product FAQ parser rejects incomplete or excessive entries", () => {
  assert.equal(parseProductFaqEntries("A question without an answer"), null);
  assert.equal(parseProductFaqEntries("Question? :: "), null);
  assert.equal(parseProductFaqEntries(Array.from({ length: 11 }, (_, index) => `Q${index}? :: A${index}`).join("\n")), null);
  assert.deepEqual(parseProductFaqEntries(" \n "), []);
});

test("product applications are optional newline-delimited values", () => {
  assert.deepEqual(parseProductApplications(null), []);
  assert.deepEqual(parseProductApplications("  General use \n\nWork use "), ["General use", "Work use"]);
});

test("product and category metadata uses concise real product/category content", () => {
  const metadata = createProductMetadata({
    locale: "en",
    path: "/products/sample",
    productName: "Sample",
    categoryName: "Tools",
    shortDescription: `<p>${"A useful product detail. ".repeat(12)}</p>`,
  });

  assert.equal(metadata.title, "Sample | Tools | Qasr Al Mabrook");
  assert.ok(typeof metadata.description === "string" && Array.from(metadata.description).length <= 155);
  assert.doesNotMatch(metadata.description ?? "", /<[^>]+>/);
  assert.match(buildCategorySeoDescription("Tools", null, ["Hammer"]), /Hammer/);
  assert.equal(buildProductSeoTitle("Sample", "Tools"), "Sample | Tools | Qasr Al Mabrook");
});

test("FAQ and Organization JSON-LD contain only actual structured details", () => {
  const faq = JSON.parse(createFaqStructuredData([{ question: "Question?", answer: "Answer." }]));
  assert.equal(faq["@type"], "FAQPage");
  assert.equal(faq.mainEntity[0].acceptedAnswer.text, "Answer.");

  const organization = JSON.parse(createOrganizationStructuredData());
  assert.equal(organization["@type"], "Organization");
  assert.equal(organization.telephone, "+971503093800");
  assert.equal(organization.address.addressLocality, "Sharjah");
  assert.equal(organization.address.addressCountry, "AE");
});
