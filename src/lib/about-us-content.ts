import type { Locale } from "@/lib/locales";
import { createPublicPageMetadata } from "@/lib/seo";

export type AboutUsContent = {
  title: string;
  seoTitle: string;
  metaDescription: string;
  paragraphs: string[];
  closingLabel: string;
  closingText: string;
};

export const aboutUsContent: Record<Locale, AboutUsContent> = {
  en: {
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
  },
  ar: {
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
  },
};

export type PublishedAboutUsPage = {
  hasExactLocaleTranslation: boolean;
  title: string;
  body: string;
  seoTitle: string | null;
  seoDescription: string | null;
};

export type ResolvedAboutUsContent = AboutUsContent & {
  bodyParagraphs: string[];
  fromPublishedPage: boolean;
};

export function getAboutUsDirection(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

export function bodyToParagraphs(body: string): string[] {
  const text = body
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/giu, "")
    .replace(/<br\s*\/?>/giu, "\n")
    .replace(/<\/(?:p|div|h[1-6]|li)>/giu, "\n\n")
    .replace(/<li\b[^>]*>/giu, "• ")
    .replace(/<[^>]*>/gu, "")
    .replace(/&nbsp;/giu, " ")
    .replace(/&amp;/giu, "&")
    .replace(/&lt;/giu, "<")
    .replace(/&gt;/giu, ">")
    .replace(/&quot;/giu, '"')
    .replace(/&#39;|&apos;/giu, "'")
    .replace(/\r\n?/gu, "\n")
    .trim();

  return text
    .split(/\n\s*\n|\n/gu)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function resolveAboutUsContent(
  locale: Locale,
  publishedPage?: PublishedAboutUsPage | null,
): ResolvedAboutUsContent {
  const approvedContent = aboutUsContent[locale];
  const publishedParagraphs =
    publishedPage?.hasExactLocaleTranslation && publishedPage.title.trim()
      ? bodyToParagraphs(publishedPage.body)
      : [];
  if (!publishedPage?.hasExactLocaleTranslation || !publishedParagraphs.length) {
    return {
      ...approvedContent,
      bodyParagraphs: [
        ...approvedContent.paragraphs,
        `${approvedContent.closingLabel} ${approvedContent.closingText}`,
      ],
      fromPublishedPage: false,
    };
  }

  return {
    ...approvedContent,
    title: publishedPage.title,
    seoTitle: publishedPage.seoTitle?.trim() || publishedPage.title,
    metaDescription:
      publishedPage.seoDescription?.trim() || approvedContent.metaDescription,
    bodyParagraphs: publishedParagraphs,
    fromPublishedPage: true,
  };
}

export function createAboutUsMetadata(
  locale: Locale,
  publishedPage?: PublishedAboutUsPage | null,
  alternatePublishedPage?: PublishedAboutUsPage | null,
) {
  const content = resolveAboutUsContent(locale, publishedPage);
  const alternateContent = resolveAboutUsContent(
    locale === "en" ? "ar" : "en",
    alternatePublishedPage,
  );

  return createPublicPageMetadata({
    locale,
    path: "/about-us",
    title: content.seoTitle,
    description: content.metaDescription,
    hasAlternate: Boolean(
      content.bodyParagraphs.length && alternateContent.bodyParagraphs.length,
    ),
  });
}
