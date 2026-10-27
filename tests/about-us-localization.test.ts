import assert from "node:assert/strict";
import test from "node:test";

import {
  createAboutUsMetadata,
  aboutUsContent,
  bodyToParagraphs,
  getAboutUsDirection,
  resolveAboutUsContent,
} from "@/lib/about-us-content";
import { createPublicPageMetadata, getLocalizedPageMetadataState } from "@/lib/seo";

test("approved About Us content is complete and localized exactly", () => {
  assert.deepEqual(aboutUsContent.en, {
    title: "About Qasr Al Mabrook",
    seoTitle: "About Us | Qasr Al Mabrook",
    metaDescription:
      "Discover Qasr Al Mabrook's diverse product catalogue, explore trusted brands, and connect with our team in Sharjah, UAE.",
    paragraphs: [
      "Qasr Al Mabrook brings together a diverse range of products in one convenient place. Based in Al Ghuwair, Hay Al Gharb, Sharjah, United Arab Emirates, our website helps customers explore our catalogue, discover products, and get in touch with us for enquiries.",
      "Our range spans multiple categories, including fabrics and textiles, men's fashion, gloves, measuring tapes, hair oils, and other everyday essentials. Our catalogue features brands such as Yokohama, DPL, Vaultex, Workland, Amul Comfy, Dream City, and Taurus.",
      "We aim to make discovering products straightforward by providing an accessible catalogue, product information, category browsing, and convenient enquiry options. Whether you are exploring a particular product or looking for more information, our website helps you find what you need and connect with our team.",
      "We welcome you to explore the Qasr Al Mabrook catalogue or contact us for assistance.",
    ],
    closingLabel: "Visit us:",
    closingText: "Al Ghuwair, Hay Al Gharb, Sharjah, United Arab Emirates.",
  });
  assert.deepEqual(aboutUsContent.ar, {
    title: "من نحن | قصر المبارك",
    seoTitle: "من نحن | قصر المبارك",
    metaDescription:
      "تعرّف على قصر المبارك، واستكشف مجموعة متنوعة من المنتجات والعلامات التجارية، وتواصل مع فريقنا في الشارقة، الإمارات العربية المتحدة.",
    paragraphs: [
      "يجمع قصر المبارك مجموعة متنوعة من المنتجات في مكان واحد يسهل الوصول إليه. يقع متجرنا في الغوير، حي الغرب، الشارقة، الإمارات العربية المتحدة، ويتيح موقعنا للزوار استكشاف الكتالوج والتعرّف على المنتجات والتواصل معنا للاستفسارات.",
      "تشمل مجموعة منتجاتنا عدة فئات، منها الأقمشة والمنسوجات، وأزياء الرجال، والقفازات، وأشرطة القياس، وزيوت الشعر، وغيرها من المنتجات اليومية. كما يضم كتالوجنا علامات تجارية مثل Yokohama وDPL وVaultex وWorkland وAmul Comfy وDream City وTaurus.",
      "نسعى إلى تسهيل اكتشاف المنتجات من خلال توفير كتالوج واضح، ومعلومات عن المنتجات، وإمكانية التصفح حسب الفئة، ووسائل ميسّرة للتواصل والاستفسار. سواء كنت تبحث عن منتج معين أو ترغب في معرفة المزيد من التفاصيل، يساعدك موقعنا في استكشاف الخيارات المتاحة والتواصل مع فريقنا.",
      "ندعوك إلى استكشاف كتالوج قصر المبارك والتواصل معنا للحصول على المساعدة.",
    ],
    closingLabel: "موقعنا:",
    closingText: "الغوير، حي الغرب، الشارقة، الإمارات العربية المتحدة.",
  });
});

test("About Us uses approved localized fallback content and RTL direction for Arabic", () => {
  for (const locale of ["en", "ar"] as const) {
    const resolved = resolveAboutUsContent(locale, null);
    assert.equal(resolved.fromPublishedPage, false);
    assert.equal(resolved.title, aboutUsContent[locale].title);
    assert.deepEqual(resolved.bodyParagraphs, [
      ...aboutUsContent[locale].paragraphs,
      `${aboutUsContent[locale].closingLabel} ${aboutUsContent[locale].closingText}`,
    ]);
    assert.equal(new Set(resolved.bodyParagraphs).size, resolved.bodyParagraphs.length);
  }
  assert.equal(getAboutUsDirection("en"), "ltr");
  assert.equal(getAboutUsDirection("ar"), "rtl");
});

test("About Us prefers exact published localized translations and safely separates paragraphs", () => {
  for (const locale of ["en", "ar"] as const) {
    const published = {
      hasExactLocaleTranslation: true,
      title: `Published ${locale} localized title`,
      body: "<p>First paragraph</p><p>Second &amp; final paragraph</p>",
      seoTitle: `Published ${locale} SEO title`,
      seoDescription: `Published ${locale} meta description`,
    };
    const resolved = resolveAboutUsContent(locale, published);

    assert.equal(resolved.fromPublishedPage, true);
    assert.equal(resolved.title, published.title);
    assert.equal(resolved.seoTitle, published.seoTitle);
    assert.equal(resolved.metaDescription, published.seoDescription);
    assert.deepEqual(resolved.bodyParagraphs, [
      "First paragraph",
      "Second & final paragraph",
    ]);
    assert.equal(
      resolveAboutUsContent(locale, {
        ...published,
        hasExactLocaleTranslation: false,
      }).fromPublishedPage,
      false,
    );
    assert.equal(
      resolveAboutUsContent(locale, { ...published, body: "" }).fromPublishedPage,
      false,
    );
  }
  assert.deepEqual(bodyToParagraphs("<p>One</p><p>Two</p><script>unsafe()</script>"), [
    "One",
    "Two",
  ]);
});

test("localized page metadata state omits alternates when either exact translation is unavailable", () => {
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

test("approved About Us fallback metadata is reciprocal, canonical, indexable, and not duplicated", () => {
  for (const locale of ["en", "ar"] as const) {
    const metadata = createAboutUsMetadata(locale, null, null);
    const content = aboutUsContent[locale];
    const brand = locale === "ar" ? "قصر المبارك" : "Qasr Al Mabrook";

    assert.equal(
      metadata.alternates?.canonical,
      `https://www.qasralmabrook.com/${locale}/about-us`,
    );
    assert.equal(
      metadata.alternates?.languages?.en,
      "https://www.qasralmabrook.com/en/about-us",
    );
    assert.equal(
      metadata.alternates?.languages?.ar,
      "https://www.qasralmabrook.com/ar/about-us",
    );
    assert.equal(metadata.robots, undefined);
    assert.equal((metadata.title as string).split(brand).length - 1, 1);
    assert.equal(metadata.title, content.seoTitle);
    assert.equal(metadata.description, content.metaDescription);
  }
});
