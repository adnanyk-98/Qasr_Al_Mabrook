import type { Locale } from "@/lib/locales";

type CatalogueLandingLink = {
  href: string;
  label: string;
};

type CategoryLandingContent = {
  heading: string;
  seoDescription: string;
  intro: string;
  linkHeading: string;
  links: CatalogueLandingLink[];
};

type ProductLandingContent = {
  heading: string;
  seoTitle: string;
  seoDescription: string;
  description: string;
  imageAlt?: string;
};

export function getCategoryLandingContent(
  locale: Locale,
  slug: string,
): CategoryLandingContent | null {
  if (slug === "measuring-tape") {
    return locale === "ar"
      ? {
          heading: "أشرطة قياس Yokohama",
          seoDescription:
            "تعرّف على أشرطة قياس Yokohama بطول 5 و5.5 و7.5 أمتار. يقع قصر المبارك في الشارقة، الإمارات العربية المتحدة.",
          intro:
            "تضم هذه الفئة أشرطة قياس Yokohama بطول 5 و5.5 و7.5 أمتار. يقع قصر المبارك في الشارقة، الإمارات العربية المتحدة؛ ويمكنك مقارنة الخيارات المعروضة وخصائص كل منتج المسجلة.",
          linkHeading: "استكشف أشرطة القياس المدرجة",
          links: [
            { href: "/products/5m-measuring-tape-green", label: "شريط قياس 5 أمتار" },
            {
              href: "/products/5-5m-measuring-tape-green",
              label: "شريط قياس 5.5 أمتار",
            },
            {
              href: "/products/7-5m-measuring-tape-green",
              label: "شريط قياس 7.5 أمتار",
            },
          ],
        }
      : {
          heading: "Yokohama Measuring Tapes",
          seoDescription:
            "Explore Yokohama measuring tapes in the UAE, with 5M, 5.5M and 7.5M lengths listed. Qasr Al Mabrook is based in Sharjah.",
          intro:
            "This category features Yokohama measuring tapes in 5M, 5.5M and 7.5M lengths. Qasr Al Mabrook is based in Sharjah, UAE; compare the listed options and each product's recorded features.",
          linkHeading: "Explore listed measuring tape models",
          links: [
            {
              href: "/products/5m-measuring-tape-green",
              label: "5M Measuring Tape Green",
            },
            {
              href: "/products/5-5m-measuring-tape-green",
              label: "5.5M Measuring Tape Green",
            },
            {
              href: "/products/7-5m-measuring-tape-green",
              label: "7.5M Measuring Tape Green",
            },
          ],
        };
  }

  if (slug === "gloves") {
    return locale === "ar"
      ? {
          heading: "قفازات DPL الصناعية المطاطية",
          seoDescription:
            "تعرّف على قفازات DPL المهنية، ومنها Grandeur 70 ببطانة فلوك ونقشة لتحسين التماسك. يقع قصر المبارك في الشارقة، الإمارات.",
          intro:
            "تضم فئة القفازات قفازات DPL Grandeur 70 المهنية. وتُظهر بيانات المنتج تركيبة من النيوبرين والمطاط الطبيعي، وبطانة داخلية من الفلوك، وسمكًا يبلغ 28 ميل أو 0.70 مم، وأسطحًا منقوشة على راحة اليد والأصابع. يقع قصر المبارك في الشارقة، الإمارات العربية المتحدة.",
          linkHeading: "تعرّف على قفازات DPL الصناعية",
          links: [{ href: "/products/dpl-gloves", label: "قفازات DPL Grandeur 70" }],
        }
      : {
          heading: "Industrial Rubber Gloves",
          seoDescription:
            "DPL industrial gloves: Grandeur 70 uses neoprene/natural rubber, flock lining and textured grip. Qasr Al Mabrook, Sharjah, UAE.",
          intro:
            "This category features DPL Grandeur 70 industrial rubber gloves. The product listing describes a neoprene and natural rubber construction, a flock-lined interior, 28 mil (0.70 mm) thickness, and textured palm and finger surfaces. Qasr Al Mabrook is based in Sharjah, UAE.",
          linkHeading: "View DPL industrial rubber gloves",
          links: [
            { href: "/products/dpl-gloves", label: "DPL Industrial Rubber Gloves" },
          ],
        };
  }

  if (slug === "safety-shoes") {
    return locale === "ar"
      ? {
          heading: "أحذية سلامة VAULTEX",
          seoDescription:
            "تعرّف على أحذية سلامة VAULTEX VTI البنية للاستخدام الصناعي ومواقع البناء والمستودعات في الإمارات.",
          intro:
            "تضم هذه الفئة أحذية سلامة VAULTEX VTI البنية، المتاحة للاستفسار لدى قصر المبارك في الشارقة والإمارات العربية المتحدة.",
          linkHeading: "استكشف أحذية السلامة المدرجة",
          links: [
            { href: "/products/vaultex-safety-shoes", label: "VAULTEX SAFETY SHOES" },
          ],
        }
      : {
          heading: "VAULTEX SAFETY SHOES",
          seoDescription:
            "Explore Vaultex VTI brown safety shoes in the UAE for industrial, construction and warehouse workplaces.",
          intro:
            "This category features Vaultex VTI brown safety shoes, available to enquire about at Qasr Al Mabrook in Sharjah, UAE.",
          linkHeading: "Explore listed safety shoes",
          links: [
            { href: "/products/vaultex-safety-shoes", label: "VAULTEX SAFETY SHOES" },
          ],
        };
  }

  return null;
}

export function getProductLandingContent(
  locale: Locale,
  slug: string,
): ProductLandingContent | null {
  if (slug === "vaultex-safety-shoes") {
    return locale === "ar"
      ? {
          heading: "أحذية سلامة VAULTEX",
          seoTitle: "أحذية سلامة VAULTEX في الإمارات | قصر المبارك",
          seoDescription:
            "تعرّف على أحذية السلامة البنية من VAULTEX VTI لدى قصر المبارك للاستخدام الصناعي ومواقع البناء والمستودعات.",
          description:
            "أحذية السلامة البنية من VAULTEX VTI مخصصة للاستخدام الصناعي ومواقع البناء والمستودعات وبيئات العمل اليومية، ومتاحة للاستفسار لدى قصر المبارك في الشارقة والإمارات.",
          imageAlt: "حذاء سلامة VAULTEX VTI بني مع عبوة الأحذية الواقية",
        }
      : {
          heading: "VAULTEX SAFETY SHOES",
          seoTitle: "Vaultex Safety Shoes in UAE | Qasr Al Mabrook",
          seoDescription:
            "Explore Vaultex VTI brown safety shoes at Qasr Al Mabrook. Suitable for industrial, construction and warehouse workplaces. Contact us for enquiries.",
          description:
            "Vaultex VTI brown safety shoes are presented for industrial work, construction sites, warehouses and daily workplace use. Contact Qasr Al Mabrook in Sharjah for current product information and enquiries.",
          imageAlt:
            "Vaultex VTI brown safety shoes with protective footwear packaging",
        };
  }

  if (slug === "pajama") {
    return locale === "ar"
      ? {
          heading: "بيجاما رجالي من Citylife",
          seoTitle: "بيجاما رجالي من Citylife",
          seoDescription:
            "تعرّف على بيجاما Citylife الرجالية بقصة عادية وتصاميم مربعة ومنقوشة. يقع قصر المبارك في الشارقة، الإمارات.",
          description:
            "بنطال بيجاما رجالي من Citylife بقصة عادية، بتصاميم مربعة ومنقوشة تناسب النوم والارتداء المنزلي المريح.",
        }
      : {
          heading: "Citylife Men's Pajama",
          seoTitle: "Citylife Men's Pajama",
          seoDescription:
            "Explore Citylife men's pajama trousers in regular-fit checked and printed styles. Qasr Al Mabrook is based in Sharjah, UAE.",
          description:
            "Citylife men's pajama trousers are described as regular fit, with checked and printed styling for comfortable sleepwear and relaxed homewear.",
        };
  }

  if (slug !== "dpl-gloves") return null;

  return locale === "ar"
    ? {
        heading: "قفازات DPL الصناعية المطاطية",
        seoTitle: "قفازات DPL Grandeur 70",
        seoDescription:
          "قفازات DPL Grandeur 70 المهنية ببطانة فلوك وأسطح منقوشة وسمك 28 ميل أو 0.70 مم. يقع قصر المبارك في الشارقة، الإمارات.",
        description:
          "قفازات DPL Grandeur 70 الصناعية مصنوعة من النيوبرين والمطاط الطبيعي، مع بطانة داخلية من الفلوك. يبلغ سمكها 28 ميل أو 0.70 مم، وتتميز راحة اليد والأصابع بأسطح منقوشة. القفازات مغسولة بالكلور وتحمل علامات Type A: AKLMNPT وEN 388:2016 – 3110X ومعايير EN ISO 374. ويوفر الكف الممتد تغطية إضافية حول المعصم وأسفل اليد. يقع قصر المبارك في الشارقة، الإمارات العربية المتحدة.",
      }
    : {
        heading: "DPL Industrial Rubber Gloves",
        seoTitle: "DPL Grandeur 70 Industrial Gloves",
        seoDescription:
          "DPL Grandeur 70 industrial gloves with flock lining, textured grip and 28 mil (0.70 mm) thickness. Qasr Al Mabrook is based in Sharjah, UAE.",
        description:
          "DPL Grandeur 70 industrial rubber gloves are made from neoprene and natural rubber with a flock-lined interior. They are 28 mil (0.70 mm) thick, with textured surfaces across the palm and fingers. The gloves are chlorine washed and marked Type A: AKLMNPT, EN 388:2016 – 3110X and EN ISO 374. Their extended cuff provides additional coverage around the wrist and lower hand. Qasr Al Mabrook is based in Sharjah, UAE.",
      };
}

export function getHomepageCatalogueLinks(locale: Locale): CatalogueLandingLink[] {
  return locale === "ar"
    ? [
        { href: "/categories/measuring-tape", label: "أشرطة قياس Yokohama" },
        { href: "/categories/gloves", label: "قفازات DPL الصناعية" },
        { href: "/products/dpl-gloves", label: "قفازات DPL Grandeur 70" },
      ]
    : [
        { href: "/categories/measuring-tape", label: "Yokohama Measuring Tapes" },
        { href: "/categories/gloves", label: "DPL Industrial Gloves" },
        { href: "/products/dpl-gloves", label: "DPL Grandeur 70 Gloves" },
      ];
}
