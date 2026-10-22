import { localePath, type Locale } from "@/lib/locales";

export type LocalizedText = Record<Locale, string>;

export type BlogArticle = {
  slug: string;
  publishedAt: string;
  updatedAt: string;
  featuredImage: string;
  title: LocalizedText;
  excerpt: LocalizedText;
  summary: LocalizedText;
  body: Record<Locale, string[]>;
  seoTitle?: LocalizedText;
  seoDescription?: LocalizedText;
};

export const blogArticles: BlogArticle[] = [
  {
    slug: "shopping-guide",
    publishedAt: "2026-10-02",
    updatedAt: "2026-10-02",
    featuredImage: "/catalogue/FANCY%20SUIT/FANCY%20SUIT-%2301.jpg",
    title: {
      en: "How to Shop the Qasr Al Mabrook Catalogue",
      ar: "كيف تتسوق في كتالوج قصر المبارك",
    },
    excerpt: {
      en: "A practical guide to browsing the Qasr Al Mabrook catalogue by category, reviewing product pages, and moving from discovery to enquiry with clarity.",
      ar: "دليل عملي لتصفح كتالوج قصر المبارك حسب الفئة ومراجعة صفحات المنتجات والانتقال من الاكتشاف إلى الاستفسار بوضوح.",
    },
    summary: {
      en: "The simplest route is to begin with the relevant category, inspect the matching product page, and request a quote when the item fits the shopping need.",
      ar: "ابدأ بالفئة المناسبة، ثم راجع صفحة المنتج المقصود واطلب عرض سعر إذا كان يلبي احتياجك.",
    },
    body: {
      en: [
        '<h2>Start with the category</h2><p>Browsing the catalogue becomes easier when the shopper starts with the category pages instead of searching without context. The Qasr Al Mabrook collection is arranged so that related products sit together, which makes it simpler to narrow the options before moving to a product detail page.</p><p>Shoppers may begin with the <a href="category-id:fe12dc19-cd89-452b-83d0-f6aedd948386">Fancy Suit</a> section, the <a href="category-id:a8d36d07-3881-410a-a8a5-cb81ba72dc00">Men\'s Bottom Wear</a> category, or the <a href="category-id:f4b74bfb-a999-416e-8402-f48bea7c3f36">Measuring Tapes</a> category depending on the item type they are researching.</p>',
        '<h2>Compare products from the relevant category</h2><p>Once the category is clear, the next step is to compare the matching product entries. Product pages are the best place to confirm the exact item in the current catalogue because they show how the product sits within the broader collection structure.</p><p>For example, a shopper may compare the <a href="/en/products/5m-measuring-tape-green">5M Measuring Tape Green</a> and <a href="/en/products/7-5m-measuring-tape-green">7.5M Measuring Tape Green</a> entries to understand the range before making a decision.</p>',
        "<h2>Move from discovery to enquiry</h2><p>After reviewing the category and product details, the final practical step is to request a quote or contact the team. This keeps the shopping flow efficient and grounded in the live catalogue structure rather than a broad or unfocused browse.</p>",
      ],
      ar: [
        '<h2>ابدأ بالفئة</h2><p>يصبح تصفح الكتالوج أسهل عندما يبدأ المتسوق من صفحات الفئات بدلًا من البحث دون سياق. تم ترتيب مجموعة قصر المبارك بحيث تجتمع المنتجات ذات الصلة معًا، ما يجعل تضييق الخيارات أبسط قبل الانتقال إلى صفحة تفاصيل المنتج.</p><p>يمكن للمتسوق أن يبدأ من قسم <a href="category-id:fe12dc19-cd89-452b-83d0-f6aedd948386">البدلات الفاخرة</a> أو <a href="category-id:a8d36d07-3881-410a-a8a5-cb81ba72dc00">البيجاما</a> أو <a href="category-id:f4b74bfb-a999-416e-8402-f48bea7c3f36">أشرطة القياس</a> حسب نوع العنصر الذي يبحث عنه.</p>',
        '<h2>قارن المنتجات ضمن الفئة المناسبة</h2><p>بعد تحديد الفئة، قارن المنتجات المعروضة فيها. وتساعدك صفحات المنتجات على التأكد من تفاصيل المنتج وموقعه ضمن المجموعة المتاحة في الكتالوج.</p><p>على سبيل المثال، يمكنك مقارنة <a href="/ar/products/5m-measuring-tape-green">شريط القياس الأخضر بطول 5 أمتار</a> و<a href="/ar/products/7-5m-measuring-tape-green">شريط القياس الأخضر بطول 7.5 متر</a> للتعرّف على الخيارات قبل اتخاذ القرار.</p>',
        "<h2>انتقل من استكشاف المنتجات إلى الاستفسار</h2><p>بعد مراجعة الفئة وتفاصيل المنتج، يمكنك طلب عرض سعر أو التواصل مع الفريق. وبذلك تبقى رحلة التسوق واضحة ومرتبطة بالمنتجات المتاحة في الكتالوج.</p>",
      ],
    },
    seoTitle: {
      en: "How to Shop the Qasr Al Mabrook Catalogue",
      ar: "كيف تتسوق في كتالوج قصر المبارك",
    },
    seoDescription: {
      en: "Browse the Qasr Al Mabrook catalogue by category, review the right product pages, and move from discovery to enquiry with confidence.",
      ar: "تصفح كتالوج قصر المبارك حسب الفئة، وراجع صفحات المنتجات المناسبة، ثم انتقل من استكشاف المنتجات إلى الاستفسار بثقة.",
    },
  },
  {
    slug: "choosing-everyday-essentials",
    publishedAt: "2026-10-02",
    updatedAt: "2026-10-02",
    featuredImage: "/catalogue/Pajama/Pajama-%2301.jpg",
    title: {
      en: "Everyday Essentials by Category",
      ar: "اختيار الفئة المناسبة لمشترياتك اليومية",
    },
    excerpt: {
      en: "A category-selection guide for everyday shopping, showing how to match the product need to the right catalogue section before comparing specific items.",
      ar: "دليل لاختيار الفئة المناسبة لاحتياجك من المنتجات قبل مقارنة الخيارات المتاحة في الكتالوج.",
    },
    summary: {
      en: "The easiest everyday-shopping approach is to match the item type to the most relevant category and then confirm the exact product entry before requesting a quote.",
      ar: "ابدأ بتحديد نوع المنتج واختيار الفئة الأنسب له، ثم راجع صفحة المنتج المقصود قبل طلب عرض سعر.",
    },
    body: {
      en: [
        '<h2>Start with the product type</h2><p>When shoppers are looking for an everyday purchase, the first useful step is to identify the product type. A broad browse is less effective than matching the item to the right catalogue category first.</p><p>For example, a shopper looking at sleepwear or relaxed homewear may review the <a href="category-id:a8d36d07-3881-410a-a8a5-cb81ba72dc00">Men\'s Bottom Wear</a> category, while someone browsing textile or garment-related items may begin with <a href="category-id:3703a065-d590-4335-80d3-fcebdaf5dd61">Fabrics &amp; Textiles</a> or <a href="category-id:fe12dc19-cd89-452b-83d0-f6aedd948386">Fancy Suit</a>.</p>',
        "<h2>Use category context to reduce guesswork</h2><p>Category pages help build a clearer picture of how the collection is organised. They also make it easier to compare products that belong in the same group without jumping between unrelated catalogue sections.</p>",
        "<h2>Confirm the product entry before the quote</h2><p>After a category is selected, the next step is to review the exact product page and confirm whether it matches the intended purchase. This keeps the buying journey practical and focused.</p>",
      ],
      ar: [
        '<h2>ابدأ بنوع المنتج</h2><p>عندما تبحث عن مشترياتك اليومية، ابدأ بتحديد نوع المنتج. فاختيار الفئة المناسبة في الكتالوج أكثر فاعلية من التصفح العام.</p><p>على سبيل المثال، يمكنك تصفح <a href="category-id:a8d36d07-3881-410a-a8a5-cb81ba72dc00">فئة البيجاما</a> إذا كنت تبحث عن ملابس النوم أو الملابس المنزلية المريحة، أو البدء بفئة <a href="category-id:3703a065-d590-4335-80d3-fcebdaf5dd61">الأقمشة والمنسوجات</a> أو <a href="category-id:fe12dc19-cd89-452b-83d0-f6aedd948386">البدلات الفاخرة</a> عند البحث عن منتجات النسيج أو الملابس.</p>',
        "<h2>استخدم سياق الفئة لتقليل التخمين</h2><p>تساعد صفحات الفئات على بناء صورة أوضح لكيفية تنظيم المجموعة. كما تجعل مقارنة المنتجات التي تنتمي إلى نفس المجموعة أسهل دون الانتقال بين أقسام الكتالوج غير المرتبطة.</p>",
        "<h2>تحقق من صفحة المنتج قبل طلب عرض السعر</h2><p>بعد اختيار الفئة، راجع صفحة المنتج للتأكد من ملاءمته لاحتياجك. يساعدك ذلك على إبقاء رحلة الشراء واضحة ومركزة.</p>",
      ],
    },
    seoTitle: {
      en: "Everyday Essentials by Category",
      ar: "اختيار الفئة المناسبة لمشترياتك اليومية",
    },
    seoDescription: {
      en: "Match the product need to the right Qasr Al Mabrook catalogue category before comparing specific items or requesting a quote.",
      ar: "اختر الفئة المناسبة لاحتياجك من المنتجات في كتالوج قصر المبارك قبل مقارنة الخيارات أو طلب عرض سعر.",
    },
  },
  {
    slug: "product-discovery-for-smarter-shopping",
    publishedAt: "2026-10-02",
    updatedAt: "2026-10-02",
    featuredImage: "/catalogue/Measuring%20Tape/5M-Measuring-Tape-Green-%2301.jpg",
    title: {
      en: "Product Discovery: Measuring Tapes",
      ar: "مقارنة منتجات شريط القياس: خيارات 5 أمتار و5.5 متر و7.5 متر",
    },
    excerpt: {
      en: "A product-discovery article comparing the measuring-tape family in the catalogue and the differences between the available lengths and colour variants.",
      ar: "دليل لمقارنة أشرطة القياس المتاحة في الكتالوج والتعرّف على الفروق بين أطوالها وألوانها.",
    },
    summary: {
      en: "This guide uses the Measuring Tape family as a clear catalogue example for comparing product variants by length and colour without adding unsupported claims.",
      ar: "يعرض هذا الدليل أشرطة القياس المتاحة في الكتالوج، ويوضح كيفية مقارنة خياراتها بحسب الطول واللون، من دون إضافة معلومات غير موثقة.",
    },
    body: {
      en: [
        '<h2>What measuring tape options are in the catalogue?</h2><p>The <a href="category-id:f4b74bfb-a999-416e-8402-f48bea7c3f36">Measuring Tapes category</a> brings together the main product family relevant to this comparison. The catalogue includes the <a href="/en/products/5m-measuring-tape-green">5M Measuring Tape Green</a>, <a href="/en/products/5m-measuring-tape-orange">5M Measuring Tape Orange</a>, <a href="/en/products/5-5m-measuring-tape-green">5.5M Measuring Tape Green</a>, and <a href="/en/products/7-5m-measuring-tape-green">7.5M Measuring Tape Green</a> entries.</p>',
        "<h2>Comparing the available lengths</h2><p>Each product name identifies the recorded length and colour. This makes the comparison straightforward because the product titles already show the difference between the 5M, 5.5M and 7.5M variants before the shopper reaches the individual product page.</p>",
        "<h3>5M options</h3><p>The 5M measuring-tape entries show the most compact range in the family and are useful when the workload usually stays within five metres. The green and orange versions differ mainly by colour, while the overall measuring range stays the same.</p>",
        "<h3>5.5M option</h3><p>The 5.5M green option offers a slightly longer reach than the standard 5M versions. This is useful when the task is close to five metres but a little extra room is helpful.</p>",
        "<h3>7.5M option</h3><p>The 7.5M green option represents the longest range in the collection and is the clearest choice for jobs that require more distance than the 5M or 5.5M models.</p>",
        "<h2>Which option should you consider?</h2><p>The practical decision is based on the measurement range required for the task. A shopper reviewing a standard 5M need can start with the 5M variants, while someone working with slightly larger dimensions may compare the 5.5M and 7.5M alternatives before continuing to the enquiry stage.</p>",
        '<h2>Explore the measuring tape category</h2><p>For shoppers who want to continue comparing products, the next step is to review the full <a href="category-id:f4b74bfb-a999-416e-8402-f48bea7c3f36">Measuring Tapes category</a> and then confirm the best product entry.</p>',
      ],
      ar: [
        '<h2>ما خيارات أشرطة القياس المتاحة في الكتالوج؟</h2><p>تجمع <a href="category-id:f4b74bfb-a999-416e-8402-f48bea7c3f36">فئة أشرطة القياس</a> المنتجات ذات الصلة بهذه المقارنة. ويضم الكتالوج <a href="/ar/products/5m-measuring-tape-green">شريط القياس الأخضر بطول 5 أمتار</a> و<a href="/ar/products/5m-measuring-tape-orange">شريط القياس البرتقالي بطول 5 أمتار</a> و<a href="/ar/products/5-5m-measuring-tape-green">شريط القياس الأخضر بطول 5.5 متر</a> و<a href="/ar/products/7-5m-measuring-tape-green">شريط القياس الأخضر بطول 7.5 متر</a>.</p>',
        "<h2>قارن بين الأطوال المتاحة</h2><p>يوضح اسم كل منتج طوله ولونه، ما يسهل مقارنة خيارات 5 أمتار و5.5 متر و7.5 متر قبل زيارة صفحة المنتج.</p>",
        "<h3>خيارات 5 أمتار</h3><p>تُعد خيارات 5 أمتار الأقصر في المجموعة، وتناسب المهام التي لا يتجاوز طولها عادةً خمسة أمتار. ويختلف الخياران الأخضر والبرتقالي في اللون، بينما يبقى مدى القياس واحدًا.</p>",
        "<h3>خيار 5.5 متر</h3><p>يوفر الخيار الأخضر بطول 5.5 متر مدى أطول قليلًا من خياري 5 أمتار. وقد يفيد ذلك عندما تقترب المهمة من خمسة أمتار وتلزم زيادة بسيطة في الطول.</p>",
        "<h3>خيار 7.5 متر</h3><p>الخيار الأخضر بطول 7.5 متر هو الأطول في المجموعة، ويناسب المهام التي تتطلب قياس مسافة تتجاوز 5 أمتار أو 5.5 متر.</p>",
        "<h2>أي خيار يناسب احتياجك؟</h2><p>يعتمد الاختيار على مدى القياس المطلوب. إذا كنت تحتاج إلى قياس لا يتجاوز 5 أمتار، فابدأ بأحد الخيارات بهذا الطول؛ أما إذا كانت الأبعاد أكبر، فقارن بين خياري 5.5 و7.5 متر قبل إرسال استفسارك.</p>",
        '<h2>استكشف فئة أشرطة القياس</h2><p>لمواصلة المقارنة، راجع <a href="category-id:f4b74bfb-a999-416e-8402-f48bea7c3f36">فئة أشرطة القياس</a> ثم اختر صفحة المنتج المناسبة.</p>',
      ],
    },
    seoTitle: {
      en: "Product Discovery: Measuring Tapes",
      ar: "مقارنة خيارات أشرطة القياس: 5 و5.5 و7.5 أمتار",
    },
    seoDescription: {
      en: "Compare the Qasr Al Mabrook measuring-tape family and review the available 5M, 5.5M and 7.5M options before you request a quote.",
      ar: "قارن بين أشرطة القياس المتاحة في كتالوج قصر المبارك، واستعرض خيارات 5 و5.5 و7.5 أمتار قبل طلب عرض سعر.",
    },
  },
  {
    slug: "measuring-tape-buying-guide",
    publishedAt: "2026-10-02",
    updatedAt: "2026-10-02",
    featuredImage: "/catalogue/Measuring%20Tape/5M-Measuring-Tape-Green-%2301.jpg",
    title: {
      en: "How to Choose a Measuring Tape Length",
      ar: "كيفية اختيار طول شريط القياس",
    },
    excerpt: {
      en: "A buying guide for selecting the right measuring-tape length and colour variant from the Qasr Al Mabrook catalogue.",
      ar: "دليل شراء لاختيار طول شريط القياس واللون المناسب من كتالوج قصر المبارك.",
    },
    summary: {
      en: "The decision is easiest when it is based on the measurement range needed and the product names shown in the measuring-tape category.",
      ar: "يسهل الاختيار عند تحديد مدى القياس المطلوب ومراجعة أسماء المنتجات في فئة أشرطة القياس.",
    },
    body: {
      en: [
        '<h2>What measuring tape lengths are in the catalogue?</h2><p>The <a href="category-id:f4b74bfb-a999-416e-8402-f48bea7c3f36">Measuring Tapes category</a> groups the product family in a way that makes comparison simple. The catalogue lists the 5M, 5.5M and 7.5M variants, with an additional colour option in the 5M range.</p>',
        '<h2>Comparing the 5M, 5.5M and 7.5M variants</h2><p>The product names clearly identify the product length and colour. For example, the catalogue includes <a href="/en/products/5m-measuring-tape-green">5M Measuring Tape Green</a>, <a href="/en/products/5m-measuring-tape-orange">5M Measuring Tape Orange</a>, <a href="/en/products/5-5m-measuring-tape-green">5.5M Measuring Tape Green</a>, and <a href="/en/products/7-5m-measuring-tape-green">7.5M Measuring Tape Green</a>.</p>',
        "<h3>5M options</h3><p>Choose a 5M version when the task usually stays within five metres. The green and orange options are both in the same length range, with the colour difference acting as the main visible variation.</p>",
        "<h3>5.5M option</h3><p>The 5.5M variant is useful when a little extra reach is helpful without stepping straight to the longest model in the group.</p>",
        "<h3>7.5M option</h3><p>The 7.5M option is the longest-range choice and is the most relevant option for tasks that go beyond the 5M or 5.5M range.</p>",
        "<h2>Which length fits your task?</h2><p>Match the length to the measurement need before requesting a quote. Once the right product is identified, review the specific product page and confirm the final selection.</p>",
      ],
      ar: [
        '<h2>ما أطوال أشرطة القياس المتاحة في الكتالوج؟</h2><p>تجمع <a href="category-id:f4b74bfb-a999-416e-8402-f48bea7c3f36">فئة أشرطة القياس</a> المنتجات ذات الصلة لتسهيل المقارنة. ويضم الكتالوج خيارات بأطوال 5 و5.5 و7.5 أمتار، مع توفر لون إضافي ضمن خيار 5 أمتار.</p>',
        '<h2>قارن بين خيارات 5 و5.5 و7.5 أمتار</h2><p>توضح أسماء المنتجات طول الشريط ولونه. فعلى سبيل المثال، يضم الكتالوج <a href="/ar/products/5m-measuring-tape-green">شريط القياس الأخضر بطول 5 أمتار</a> و<a href="/ar/products/5m-measuring-tape-orange">شريط القياس البرتقالي بطول 5 أمتار</a> و<a href="/ar/products/5-5m-measuring-tape-green">شريط القياس الأخضر بطول 5.5 متر</a> و<a href="/ar/products/7-5m-measuring-tape-green">شريط القياس الأخضر بطول 7.5 متر</a>.</p>',
        "<h3>خيارات 5 أمتار</h3><p>اختر شريطًا بطول 5 أمتار إذا كانت المهمة لا تتجاوز هذا الطول عادةً. ويتوفر هذا الطول باللونين الأخضر والبرتقالي، مع بقاء مدى القياس نفسه.</p>",
        "<h3>خيار 5.5 متر</h3><p>يفيد خيار 5.5 متر عند الحاجة إلى طول إضافي قليل مقارنةً بخيار 5 أمتار، من دون الانتقال مباشرةً إلى أطول خيار في المجموعة.</p>",
        "<h3>خيار 7.5 متر</h3><p>الخيار بطول 7.5 متر هو الأطول في المجموعة، ويناسب المهام التي تتطلب قياس مسافة تتجاوز 5 أمتار أو 5.5 متر.</p>",
        "<h2>ما الطول المناسب لمهمتك؟</h2><p>اختر الطول وفقًا لمدى القياس الذي تحتاج إليه. بعد تحديد المنتج المناسب، راجع صفحته وتأكد من اختيارك قبل طلب عرض السعر.</p>",
      ],
    },
    seoTitle: {
      en: "How to Choose a Measuring Tape Length",
      ar: "كيفية اختيار طول شريط القياس",
    },
    seoDescription: {
      en: "Use the measuring-tape category to compare the 5M, 5.5M and 7.5M options and choose the right length for your task.",
      ar: "قارن خيارات 5 و5.5 و7.5 أمتار في فئة أشرطة القياس واختر الطول المناسب لمهمتك.",
    },
  },
  {
    slug: "pajama-guide",
    publishedAt: "2026-10-02",
    updatedAt: "2026-10-02",
    featuredImage: "/catalogue/Pajama/Pajama-%2301.jpg",
    title: {
      en: "Pajama Buying Guide for Everyday Wear",
      ar: "دليل شراء البيجاما للاستخدام اليومي",
    },
    excerpt: {
      en: "A catalogue-backed guide for exploring the Men's Bottom Wear category and reviewing the product entry before you enquire.",
      ar: "دليل يستند إلى الكتالوج للتعرّف على فئة البيجاما ومراجعة صفحة المنتج قبل الاستفسار.",
    },
    summary: {
      en: "The Men's Bottom Wear category is the clearest starting point when a shopper is reviewing sleepwear or relaxed homewear in the Qasr Al Mabrook collection.",
      ar: "تُعد فئة البيجاما نقطة البداية الأنسب عند البحث عن ملابس النوم أو الملابس المنزلية المريحة ضمن مجموعة قصر المبارك.",
    },
    body: {
      en: [
        "<h2>Start with the Men's Bottom Wear category</h2><p>The <a href=\"category-id:a8d36d07-3881-410a-a8a5-cb81ba72dc00\">Men's Bottom Wear category</a> is the clearest entry point for shoppers who are focused on sleepwear and relaxed homewear browsing. It provides the category context before a buyer reviews the specific product record.</p>",
        '<h2>Check the product entry</h2><p>The <a href="/en/products/pajama">Pajama product page</a> confirms the exact item in the catalogue and places it inside the broader product range. This helps the shopper review the item without making assumptions beyond the catalogue content.</p>',
        "<h2>When the Men's Bottom Wear category is the right fit</h2><p>If the shopping need is connected to personal wear, sleepwear, or relaxed homewear, the Men's Bottom Wear category is the most relevant place to begin. After reviewing the product page, the next practical step is to request a quote if the item matches the intended need.</p>",
      ],
      ar: [
        '<h2>ابدأ بفئة البيجاما</h2><p>تُعد <a href="category-id:a8d36d07-3881-410a-a8a5-cb81ba72dc00">فئة البيجاما</a> نقطة البداية الأنسب إذا كنت تبحث عن ملابس النوم أو الملابس المنزلية المريحة. وتساعدك الفئة على التعرّف على المنتجات قبل زيارة صفحة المنتج المحدد.</p>',
        '<h2>راجع صفحة المنتج</h2><p>تعرض <a href="/ar/products/pajama">صفحة البيجاما</a> المنتج المتاح في الكتالوج وتوضح موقعه ضمن المجموعة. وبذلك يمكنك التعرّف عليه من دون افتراض معلومات غير واردة في الكتالوج.</p>',
        "<h2>متى تناسبك فئة البيجاما؟</h2><p>إذا كان احتياجك يتعلق بالملابس الشخصية أو ملابس النوم أو الملابس المنزلية المريحة، فابدأ بفئة البيجاما. وبعد مراجعة صفحة المنتج، يمكنك طلب عرض سعر إذا كان المنتج يلبي احتياجك.</p>",
      ],
    },
    seoTitle: {
      en: "Pajama Buying Guide for Everyday Wear",
      ar: "دليل شراء البيجاما للاستخدام اليومي",
    },
    seoDescription: {
      en: "Review the Men's Bottom Wear category and Pajama product entry in the Qasr Al Mabrook catalogue before requesting a quote or continuing your browse.",
      ar: "تعرّف على فئة البيجاما وصفحة المنتج في كتالوج قصر المبارك قبل طلب عرض سعر أو مواصلة التصفح.",
    },
  },
  {
    slug: "cloth-piece-guide",
    publishedAt: "2026-10-02",
    updatedAt: "2026-10-02",
    featuredImage: "/catalogue/Cloth%20Piece/Cloth%20Piece-%2301.jpg",
    title: {
      en: "Cloth Pieces: A Guide to the Catalogue Category",
      ar: "قطع القماش في كتالوج قصر المبارك: دليل",
    },
    excerpt: {
      en: "A catalogue-focused guide explaining the Cloth Piece category and its place in garment and textile-related browsing.",
      ar: "دليل يعرّف بفئة قطع القماش وموقعها ضمن المنتجات المرتبطة بالأقمشة والملابس.",
    },
    summary: {
      en: "The Cloth Piece category is most useful when it is reviewed as a catalogue section in context, with the product page used to confirm the exact entry.",
      ar: "ابدأ بفئة قطع القماش للتعرّف على المنتجات، ثم راجع صفحة المنتج لمعرفة تفاصيل القطعة المعروضة.",
    },
    body: {
      en: [
        '<h2>What the Cloth Piece category shows</h2><p>The <a href="category-id:3703a065-d590-4335-80d3-fcebdaf5dd61">Fabrics &amp; Textiles category</a> is the right starting point for textile and garment-related catalogue browsing. It puts the product in context before the shopper reaches the specific record.</p>',
        '<h2>Review the product in context</h2><p>The <a href="/en/products/cloth-piece">Cloth Piece product page</a> confirms the exact catalogue entry and helps a shopper understand the product inside the broader category structure. This makes the review more grounded and useful for project-based browsing.</p>',
        "<h2>When this category is relevant</h2><p>This category is most relevant when the shopping need is connected to fabric, textile, or garment projects. After reviewing the section and product page, the next practical step is to request a quote if the item fits the project.</p>",
      ],
      ar: [
        '<h2>ما المنتجات التي تضمها فئة قطع القماش؟</h2><p>تُعد <a href="category-id:3703a065-d590-4335-80d3-fcebdaf5dd61">الأقمشة والمنسوجات</a> نقطة بداية مناسبة لتصفح المنتجات المرتبطة بالأقمشة والملابس. وتساعدك على التعرّف على المنتج قبل زيارة صفحته.</p>',
        '<h2>تعرّف على المنتج ضمن فئته</h2><p>تعرض <a href="/ar/products/cloth-piece">صفحة قطعة القماش</a> المنتج وتوضح موقعه ضمن الفئة. ويساعدك ذلك على فهم المنتج ومدى ارتباطه بمشروعك.</p>',
        "<h2>متى تناسبك هذه الفئة؟</h2><p>تناسب هذه الفئة احتياجات شراء الأقمشة أو المنتجات النسيجية أو مستلزمات مشاريع الملابس. وبعد مراجعة الفئة وصفحة المنتج، يمكنك طلب عرض سعر إذا كانت القطعة مناسبة لمشروعك.</p>",
      ],
    },
    seoTitle: {
      en: "Cloth Pieces: A Guide to the Catalogue Category",
      ar: "قطع القماش في كتالوج قصر المبارك: دليل",
    },
    seoDescription: {
      en: "Learn how the Cloth Piece category is presented in the Qasr Al Mabrook catalogue and review the product entry before enquiring.",
      ar: "تعرّف على فئة قطع القماش في كتالوج قصر المبارك، وراجع صفحة المنتج قبل الاستفسار.",
    },
  },
  {
    slug: "fancy-suit-guide",
    publishedAt: "2026-10-02",
    updatedAt: "2026-10-02",
    featuredImage: "/catalogue/FANCY%20SUIT/FANCY%20SUIT-%2301.jpg",
    title: {
      en: "Exploring Fancy Suit Options in the Catalogue",
      ar: "استكشاف خيارات البدلات الفاخرة في الكتالوج",
    },
    excerpt: {
      en: "A catalogue guide for reviewing the Fancy Suit category and the corresponding product entry in the Qasr Al Mabrook collection.",
      ar: "دليل لمراجعة فئة البدلات الفاخرة وصفحة المنتج المرتبطة بها في كتالوج قصر المبارك.",
    },
    summary: {
      en: "The strongest review path is to start in the Fancy Suit category, confirm the product page, and then move to the enquiry if it matches the need.",
      ar: "ابدأ بفئة البدلات الفاخرة، ثم راجع صفحة المنتج، وانتقل إلى الاستفسار إذا كان المنتج مناسبًا لاحتياجك.",
    },
    body: {
      en: [
        '<h2>What to review in the Fancy Suit category</h2><p>The <a href="category-id:fe12dc19-cd89-452b-83d0-f6aedd948386">Fancy Suit category</a> is the clearest starting point when a shopper wants to review occasion-based or formal-style catalogue entries. It offers the category context before the exact product page is examined.</p>',
        '<h2>Check the product entry</h2><p>The <a href="/en/products/fancy-suit">Fancy Suit product page</a> provides the exact item record and helps the shopper understand how it sits inside the broader catalogue. This makes the review more grounded and easier to act on.</p>',
        "<h2>When this category fits a customer need</h2><p>If the shopper is looking for a formal, occasion, or statement-style outfit within the available catalogue, the Fancy Suit category is the most relevant place to begin. From there, the next step is to confirm the product page and request a quote if needed.</p>",
      ],
      ar: [
        '<h2>ما الذي تقدمه فئة البدلات الفاخرة؟</h2><p>تُعد <a href="category-id:fe12dc19-cd89-452b-83d0-f6aedd948386">فئة البدلات الفاخرة</a> نقطة بداية مناسبة عند البحث عن ملابس للمناسبات أو أزياء ذات طابع رسمي. وتساعدك على التعرّف على المنتجات قبل زيارة صفحة المنتج المحدد.</p>',
        '<h2>راجع صفحة المنتج</h2><p>تعرض <a href="/ar/products/fancy-suit">صفحة البدلة الفاخرة</a> تفاصيل المنتج وموقعه ضمن الكتالوج، لتتمكن من مراجعته بوضوح.</p>',
        "<h2>متى تناسبك هذه الفئة؟</h2><p>إذا كنت تبحث عن زي رسمي أو ملابس مناسبة للمناسبات ضمن المنتجات المتاحة، فابدأ بفئة البدلات الفاخرة. وبعد مراجعة صفحة المنتج، يمكنك طلب عرض سعر عند الحاجة.</p>",
      ],
    },
    seoTitle: {
      en: "Exploring Fancy Suit Options in the Catalogue",
      ar: "استكشاف خيارات البدلات الفاخرة في الكتالوج",
    },
    seoDescription: {
      en: "Review the Fancy Suit category and product entry in the Qasr Al Mabrook catalogue before you enquire about the item.",
      ar: "تعرّف على فئة البدلات الفاخرة وصفحة المنتج في كتالوج قصر المبارك قبل الاستفسار.",
    },
  },
  {
    slug: "adivasi-oil-overview",
    publishedAt: "2026-10-02",
    updatedAt: "2026-10-02",
    featuredImage: "/catalogue/Adivasi%20Oil/Adivasi%20Oil-%2301.jpg",
    title: {
      en: "Adivasi Oil Overview",
      ar: "زيت أديفاسي: نظرة عامة على المنتج ومعلومات الكتالوج",
    },
    excerpt: {
      en: "A factual overview of the Adivasi Oil entry in the Qasr Al Mabrook catalogue, including its category placement and product listing.",
      ar: "عرض موضوعي لزيت أديفاسي في كتالوج قصر المبارك، يشمل فئته وصفحة المنتج.",
    },
    summary: {
      en: "This overview keeps the article factual and catalogue-led, reviewing the Adivasi Oil entry in context without adding unsupported claims.",
      ar: "يستعرض هذا المقال زيت أديفاسي في سياق الكتالوج، من دون إضافة معلومات أو ادعاءات غير موثقة.",
    },
    body: {
      en: [
        '<h2>What the Adivasi Oil catalogue entry includes</h2><p>The most accurate way to review <a href="category-id:9c63ae52-6468-4a21-b8a3-c08ae78c3d3d">Hair Oils</a> in this catalogue is to treat it as a published product entry placed within a category context. The category and product pages show where it sits in the collection and how it is presented to shoppers.</p>',
        "<h2>How to review the product in context</h2><p>Because the catalogue content is the primary source of information, the most responsible approach is to compare the product page to the category entry without extending the review beyond the published data. This keeps the overview grounded in the actual catalogue record.</p>",
        '<h2>Move to the product page or enquiry flow</h2><p>For customers who want to continue the journey, the next step is to open the <a href="/en/products/adivasi-oil">Adivasi Oil product page</a> and then request a quote if the product matches their need.</p>',
      ],
      ar: [
        '<h2>ماذا يعرض الكتالوج عن زيت أديفاسي؟</h2><p>للتعرّف على <a href="category-id:9c63ae52-6468-4a21-b8a3-c08ae78c3d3d">زيوت الشعر</a> في الكتالوج، راجع فئته وصفحة المنتج. وتوضح الصفحتان موقعه ضمن المجموعة وطريقة عرضه للمتسوقين.</p>',
        "<h2>راجع المنتج ضمن سياقه</h2><p>محتوى الكتالوج هو المصدر الأساسي للمعلومات؛ لذا قارن بين صفحة المنتج والفئة المرتبطة به، دون إضافة معلومات تتجاوز البيانات المنشورة. وبذلك يستند العرض إلى تفاصيل المنتج المتاحة فعلًا.</p>",
        '<h2>انتقل إلى صفحة المنتج أو أرسل استفسارك</h2><p>إذا رغبت في متابعة التصفح، افتح <a href="/ar/products/adivasi-oil">صفحة زيت أديفاسي</a> واطلب عرض سعر إذا كان المنتج يلبي احتياجك.</p>',
      ],
    },
    seoTitle: {
      en: "Adivasi Oil Overview",
      ar: "زيت أديفاسي: نظرة عامة على المنتج ومعلومات الكتالوج",
    },
    seoDescription: {
      en: "Review the Adivasi Oil entry in the Qasr Al Mabrook catalogue and understand how it is presented in the published collection.",
      ar: "تعرّف على زيت أديفاسي كما يعرضه كتالوج قصر المبارك ضمن المنتجات المنشورة.",
    },
  },
];

export function getBlogArticleBySlug(locale: Locale, slug: string) {
  const article = blogArticles.find((entry) => entry.slug === slug);
  if (!article) return null;

  const currentLocale = locale === "ar" ? "ar" : "en";
  return {
    ...article,
    title: article.title[currentLocale],
    excerpt: article.excerpt[currentLocale],
    summary: article.summary[currentLocale],
    body: article.body[currentLocale],
    seoTitle: article.seoTitle?.[currentLocale] ?? article.title[currentLocale],
    seoDescription:
      article.seoDescription?.[currentLocale] ?? article.excerpt[currentLocale],
  };
}

export function getBlogArticles(locale: Locale) {
  const currentLocale = locale === "ar" ? "ar" : "en";
  return blogArticles.map((article) => ({
    ...article,
    title: article.title[currentLocale],
    excerpt: article.excerpt[currentLocale],
    summary: article.summary[currentLocale],
  }));
}

export function resolveBlogHref(locale: Locale, slug: string) {
  return localePath(locale, `/blog/${slug}`);
}
