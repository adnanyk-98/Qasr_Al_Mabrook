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
      ar: "أبسط مسار هو البدء بالفئة المناسبة ومراجعة صفحة المنتج المطابقة ثم طلب عرض سعر عندما يتوافق العنصر مع الاحتياج.",
    },
    body: {
      en: [
        "<h2>Start with the category</h2><p>Browsing the catalogue becomes easier when the shopper starts with the category pages instead of searching without context. The Qasr Al Mabrook collection is arranged so that related products sit together, which makes it simpler to narrow the options before moving to a product detail page.</p><p>Shoppers may begin with the <a href=\"/en/categories/fancy-suit\">Fancy Suit</a> section, the <a href=\"/en/categories/pajama\">Pajama</a> category, or the <a href=\"/en/categories/measuring-tape\">Measuring Tape</a> category depending on the item type they are researching.</p>",
        "<h2>Compare products from the relevant category</h2><p>Once the category is clear, the next step is to compare the matching product entries. Product pages are the best place to confirm the exact item in the current catalogue because they show how the product sits within the broader collection structure.</p><p>For example, a shopper may compare the <a href=\"/en/products/5m-measuring-tape-green\">5M Measuring Tape Green</a> and <a href=\"/en/products/7-5m-measuring-tape-green\">7.5M Measuring Tape Green</a> entries to understand the range before making a decision.</p>",
        "<h2>Move from discovery to enquiry</h2><p>After reviewing the category and product details, the final practical step is to request a quote or contact the team. This keeps the shopping flow efficient and grounded in the live catalogue structure rather than a broad or unfocused browse.</p>",
      ],
      ar: [
        "<h2>ابدأ بالفئة</h2><p>يصبح تصفح الكتالوج أسهل عندما يبدأ المتسوق من صفحات الفئات بدلًا من البحث دون سياق. تم ترتيب مجموعة قصر المبارك بحيث تجتمع المنتجات ذات الصلة معًا، ما يجعل تضييق الخيارات أبسط قبل الانتقال إلى صفحة تفاصيل المنتج.</p><p>يمكن للمتسوق أن يبدأ من قسم <a href=\"/ar/categories/fancy-suit\">البدلات الفاخرة</a> أو <a href=\"/ar/categories/pajama\">البيجاما</a> أو <a href=\"/ar/categories/measuring-tape\">أشرطة القياس</a> حسب نوع العنصر الذي يبحث عنه.</p>",
        "<h2>قارن المنتجات من الفئة ذات الصلة</h2><p>بمجرد وضوح الفئة، تكون الخطوة التالية مقارنة الإدخالات المطابقة للمنتج. تعد صفحات المنتجات أفضل مكان لتأكيد العنصر الدقيق داخل الكتالوج الحالي، لأنّها توضح كيف يندمج المنتج داخل البنية الأوسع للمجموعة.</p><p>على سبيل المثال، قد يقارن المتسوق بين <a href=\"/ar/products/5m-measuring-tape-green\">شريط قياس 5 أمتار أخضر</a> و<a href=\"/ar/products/7-5m-measuring-tape-green\">شريط قياس 7.5 متر أخضر</a> لفهم النطاق قبل اتخاذ القرار.</p>",
        "<h2>انتقل من الاكتشاف إلى الاستفسار</h2><p>بعد مراجعة الفئة وتفاصيل المنتج، تكون الخطوة العملية الأخيرة طلب عرض سعر أو التواصل مع الفريق. وهذا يحافظ على تدفق التسوق بشكل واضح ومتماشي مع بنية الكتالوج الحالية بدلًا من تصفح عشوائي.</p>",
      ],
    },
    seoTitle: {
      en: "How to Shop the Qasr Al Mabrook Catalogue",
      ar: "كيف تتسوق في كتالوج قصر المبارك",
    },
    seoDescription: {
      en: "Browse the Qasr Al Mabrook catalogue by category, review the right product pages, and move from discovery to enquiry with confidence.",
      ar: "تصفح كتالوج قصر المبارك حسب الفئة، ومراجعة صفحات المنتج المناسبة، والانتقال من الاكتشاف إلى الاستفسار بثقة.",
    },
  },
  {
    slug: "choosing-everyday-essentials",
    publishedAt: "2026-10-02",
    updatedAt: "2026-10-02",
    featuredImage: "/catalogue/Pajama/Pajama-%2301.jpg",
    title: {
      en: "Finding the Right Category for Your Everyday Purchase",
      ar: "اختيار الفئة المناسبة لشراءك اليومي",
    },
    excerpt: {
      en: "A category-selection guide for everyday shopping, showing how to match the product need to the right catalogue section before comparing specific items.",
      ar: "دليل لاختيار الفئة في التسوق اليومي يوضح كيفية مطابقة احتياج المنتج إلى القسم المناسب في الكتالوج قبل مقارنة العناصر المحددة.",
    },
    summary: {
      en: "The easiest everyday-shopping approach is to match the item type to the most relevant category and then confirm the exact product entry before requesting a quote.",
      ar: "أسهل طريقة للتسوق اليومي هي مطابقة نوع العنصر إلى الفئة الأكثر صلة ثم التأكد من إدخال المنتج الدقيق قبل طلب عرض السعر.",
    },
    body: {
      en: [
        "<h2>Start with the product type</h2><p>When shoppers are looking for an everyday purchase, the first useful step is to identify the product type. A broad browse is less effective than matching the item to the right catalogue category first.</p><p>For example, a shopper looking at sleepwear or relaxed homewear may review the <a href=\"/en/categories/pajama\">Pajama</a> category, while someone browsing textile or garment-related items may begin with <a href=\"/en/categories/cloth-piece\">Cloth Piece</a> or <a href=\"/en/categories/fancy-suit\">Fancy Suit</a>.</p>",
        "<h2>Use category context to reduce guesswork</h2><p>Category pages help build a clearer picture of how the collection is organised. They also make it easier to compare products that belong in the same group without jumping between unrelated catalogue sections.</p>",
        "<h2>Confirm the product entry before the quote</h2><p>After a category is selected, the next step is to review the exact product page and confirm whether it matches the intended purchase. This keeps the buying journey practical and focused.</p>",
      ],
      ar: [
        "<h2>ابدأ بنوع المنتج</h2><p>عندما يبحث المتسوق عن شراء يومي، تكون الخطوة الأولى المفيدة هي تحديد نوع المنتج. يعد التصفح العام أقل فاعلية من مطابقة العنصر إلى الفئة المناسبة في الكتالوج أولًا.</p><p>على سبيل المثال، قد يبدأ المتسوق الذي يبحث عن ملابس النوم أو الملابس المنزلية المريحة من <a href=\"/ar/categories/pajama\">فئة البيجاما</a>، بينما قد يبدأ من يبحث عن عناصر مرتبطة بالنسيج أو الملابس من <a href=\"/ar/categories/cloth-piece\">فئة قطع القماش</a> أو <a href=\"/ar/categories/fancy-suit\">فئة البدلات الفاخرة</a>.</p>",
        "<h2>استخدم سياق الفئة لتقليل التخمين</h2><p>تساعد صفحات الفئات على بناء صورة أوضح لكيفية تنظيم المجموعة. كما تجعل مقارنة المنتجات التي تنتمي إلى نفس المجموعة أسهل دون الانتقال بين أقسام الكتالوج غير المرتبطة.</p>",
        "<h2>أكد إدخال المنتج قبل طلب السعر</h2><p>بعد اختيار الفئة، تكون الخطوة التالية مراجعة صفحة المنتج الدقيقة والتأكد من مطابقتها للشراء المقصود. وهذا يحافظ على رحلة الشراء عملية ومركزة.</p>",
      ],
    },
    seoTitle: {
      en: "Finding the Right Category for Your Everyday Purchase",
      ar: "اختيار الفئة المناسبة لشراءك اليومي",
    },
    seoDescription: {
      en: "Match the product need to the right Qasr Al Mabrook catalogue category before comparing specific items or requesting a quote.",
      ar: "طابق احتياج المنتج إلى الفئة المناسبة في كتالوج قصر المبارك قبل مقارنة العناصر المحددة أو طلب عرض السعر.",
    },
  },
  {
    slug: "product-discovery-for-smarter-shopping",
    publishedAt: "2026-10-02",
    updatedAt: "2026-10-02",
    featuredImage: "/catalogue/Measuring%20Tape/5M-Measuring-Tape-Green-%2301.jpg",
    title: {
      en: "Measuring Tape Product Comparison: 5M, 5.5M and 7.5M Options",
      ar: "مقارنة منتجات شريط القياس: خيارات 5 أمتار و5.5 متر و7.5 متر",
    },
    excerpt: {
      en: "A product-discovery article comparing the measuring-tape family in the catalogue and the differences between the available lengths and colour variants.",
      ar: "مقال اكتشاف منتجات يقارن عائلة شريط القياس في الكتالوج والاختلافات بين الأطوال والمتغيرات المتاحة للون.",
    },
    summary: {
      en: "This guide uses the Measuring Tape family as a clear catalogue example for comparing product variants by length and colour without adding unsupported claims.",
      ar: "يستخدم هذا الدليل عائلة شريط القياس كمثال واضح من الكتالوج لمقارنة المتغيرات حسب الطول واللون دون إضافة ادعاءات غير مدعومة.",
    },
    body: {
      en: [
        "<h2>What measuring tape options are in the catalogue?</h2><p>The <a href=\"/en/categories/measuring-tape\">Measuring Tape category</a> brings together the main product family relevant to this comparison. The catalogue includes the <a href=\"/en/products/5m-measuring-tape-green\">5M Measuring Tape Green</a>, <a href=\"/en/products/5m-measuring-tape-orange\">5M Measuring Tape Orange</a>, <a href=\"/en/products/5-5m-measuring-tape-green\">5.5M Measuring Tape Green</a>, and <a href=\"/en/products/7-5m-measuring-tape-green\">7.5M Measuring Tape Green</a> entries.</p>",
        "<h2>Comparing the available lengths</h2><p>Each product name identifies the recorded length and colour. This makes the comparison straightforward because the product titles already show the difference between the 5M, 5.5M and 7.5M variants before the shopper reaches the individual product page.</p>",
        "<h3>5M options</h3><p>The 5M measuring-tape entries show the most compact range in the family and are useful when the workload usually stays within five metres. The green and orange versions differ mainly by colour, while the overall measuring range stays the same.</p>",
        "<h3>5.5M option</h3><p>The 5.5M green option offers a slightly longer reach than the standard 5M versions. This is useful when the task is close to five metres but a little extra room is helpful.</p>",
        "<h3>7.5M option</h3><p>The 7.5M green option represents the longest range in the collection and is the clearest choice for jobs that require more distance than the 5M or 5.5M models.</p>",
        "<h2>Which option should you consider?</h2><p>The practical decision is based on the measurement range required for the task. A shopper reviewing a standard 5M need can start with the 5M variants, while someone working with slightly larger dimensions may compare the 5.5M and 7.5M alternatives before continuing to the enquiry stage.</p>",
        "<h2>Explore the measuring tape category</h2><p>For shoppers who want to continue comparing products, the next step is to review the full <a href=\"/en/categories/measuring-tape\">Measuring Tape category</a> and then confirm the best product entry.</p>",
      ],
      ar: [
        "<h2>ما هي خيارات شريط القياس المتاحة في الكتالوج؟</h2><p>تجمع <a href=\"/ar/categories/measuring-tape\">فئة أشرطة القياس</a> العائلة الرئيسية للمنتجات المتعلقة بهذه المقارنة. يتضمن الكتالوج إدخالات <a href=\"/ar/products/5m-measuring-tape-green\">شريط قياس 5 أمتار أخضر</a> و<a href=\"/ar/products/5m-measuring-tape-orange\">شريط قياس 5 أمتار برتقالي</a> و<a href=\"/ar/products/5-5m-measuring-tape-green\">شريط قياس 5.5 متر أخضر</a> و<a href=\"/ar/products/7-5m-measuring-tape-green\">شريط قياس 7.5 متر أخضر</a>.</p>",
        "<h2>مقارنة الأطوال المتاحة</h2><p>يحدد اسم كل منتج الطول واللون المسجلين. وهذا يجعل المقارنة واضحة لأن عناوين المنتجات توضح الفرق بين متغيرات 5 أمتار و5.5 متر و7.5 متر قبل أن يصل المتسوق إلى صفحة المنتج الفردية.</p>",
        "<h3>خيارات 5 أمتار</h3><p>تُظهر إدخالات 5 أمتار أصغر نطاق في العائلة وتكون مناسبة عندما تبقى الأعمال عادة ضمن خمسة أمتار. يختلف إصدارا الأخضر والبرتقالي بشكل أساسي في اللون، بينما يظل نطاق القياس نفسه.</p>",
        "<h3>خيار 5.5 متر</h3><p>يوفر خيار 5.5 متر أخضر مدى أطول قليلًا من إصدارات 5 أمتار القياسية. وهو مناسب عندما تكون المهمة قريبة من خمسة أمتار ولكن هناك حاجة إلى مساحة إضافية طفيفة.</p>",
        "<h3>خيار 7.5 متر</h3><p>يمثل خيار 7.5 متر الأخضر أطول مدى في المجموعة ويكون الاختيار الواضح للأعمال التي تتطلب مسافة أكبر من موديلات 5 أمتار أو 5.5 متر.</p>",
        "<h2>أي خيار يجب مراعاته؟</h2><p>القرار العملي يعتمد على مدى القياس المطلوب للمهمة. يمكن للمتسوق الذي يحتاج إلى قياس قياسي 5 أمتار أن يبدأ بإصدارات 5 أمتار، بينما قد يقارن من يعمل بأبعاد أكبر بين خيارات 5.5 متر و7.5 متر قبل المتابعة إلى مرحلة الاستفسار.</p>",
        "<h2>استكشف فئة شريط القياس</h2><p>للشخص الراغب في الاستمرار في مقارنة المنتجات، تكون الخطوة التالية مراجعة <a href=\"/ar/categories/measuring-tape\">فئة أشرطة القياس</a> كاملة ثم تأكيد إدخال المنتج الأنسب.</p>",
      ],
    },
    seoTitle: {
      en: "Measuring Tape Product Comparison: 5M, 5.5M and 7.5M Options",
      ar: "مقارنة منتجات شريط القياس: خيارات 5 أمتار و5.5 متر و7.5 متر",
    },
    seoDescription: {
      en: "Compare the Qasr Al Mabrook measuring-tape family and review the available 5M, 5.5M and 7.5M options before you request a quote.",
      ar: "قارن عائلة شريط القياس في قصر المبارك واستعرض خيارات 5 أمتار و5.5 متر و7.5 متر قبل طلب عرض السعر.",
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
      ar: "يكون القرار أسهل عندما يستند إلى مدى القياس المطلوب وأسماء المنتجات المعروضة في فئة شريط القياس.",
    },
    body: {
      en: [
        "<h2>What measuring tape lengths are in the catalogue?</h2><p>The <a href=\"/en/categories/measuring-tape\">Measuring Tape category</a> groups the product family in a way that makes comparison simple. The catalogue lists the 5M, 5.5M and 7.5M variants, with an additional colour option in the 5M range.</p>",
        "<h2>Comparing the 5M, 5.5M and 7.5M variants</h2><p>The product names clearly identify the product length and colour. For example, the catalogue includes <a href=\"/en/products/5m-measuring-tape-green\">5M Measuring Tape Green</a>, <a href=\"/en/products/5m-measuring-tape-orange\">5M Measuring Tape Orange</a>, <a href=\"/en/products/5-5m-measuring-tape-green\">5.5M Measuring Tape Green</a>, and <a href=\"/en/products/7-5m-measuring-tape-green\">7.5M Measuring Tape Green</a>.</p>",
        "<h3>5M options</h3><p>Choose a 5M version when the task usually stays within five metres. The green and orange options are both in the same length range, with the colour difference acting as the main visible variation.</p>",
        "<h3>5.5M option</h3><p>The 5.5M variant is useful when a little extra reach is helpful without stepping straight to the longest model in the group.</p>",
        "<h3>7.5M option</h3><p>The 7.5M option is the longest-range choice and is the most relevant option for tasks that go beyond the 5M or 5.5M range.</p>",
        "<h2>Which length fits your task?</h2><p>Match the length to the measurement need before requesting a quote. Once the right product is identified, review the specific product page and confirm the final selection.</p>",
      ],
      ar: [
        "<h2>ما أطوال شريط القياس المتاحة في الكتالوج؟</h2><p>تجمع <a href=\"/ar/categories/measuring-tape\">فئة أشرطة القياس</a> عائلة المنتجات بطريقة تجعل المقارنة سهلة. يتضمن الكتالوج متغيرات 5 أمتار و5.5 متر و7.5 متر، مع خيار لون إضافي ضمن نطاق 5 أمتار.</p>",
        "<h2>مقارنة متغيرات 5 أمتار و5.5 متر و7.5 متر</h2><p>تحدد أسماء المنتجات الطول واللون بوضوح. على سبيل المثال، يتضمن الكتالوج <a href=\"/ar/products/5m-measuring-tape-green\">شريط قياس 5 أمتار أخضر</a> و<a href=\"/ar/products/5m-measuring-tape-orange\">شريط قياس 5 أمتار برتقالي</a> و<a href=\"/ar/products/5-5m-measuring-tape-green\">شريط قياس 5.5 متر أخضر</a> و<a href=\"/ar/products/7-5m-measuring-tape-green\">شريط قياس 7.5 متر أخضر</a>.</p>",
        "<h3>خيارات 5 أمتار</h3><p>اختر إصدار 5 أمتار عندما تبقى المهمة عادة ضمن خمسة أمتار. تعتبر إصدارات الأخضر والبرتقالي ضمن نفس نطاق الطول، ويُعد اللون الاختلاف الواضح الوحيد.</p>",
        "<h3>خيار 5.5 متر</h3><p>يُعد متغير 5.5 متر مفيدًا عندما يكون من المفيد الحصول على مسافة إضافية طفيفة دون القفز مباشرة إلى أطول طراز في المجموعة.</p>",
        "<h3>خيار 7.5 متر</h3><p>يُعد خيار 7.5 متر أطول مدى متاح وهو الخيار الأنسب للمهمات التي تتجاوز نطاق 5 أمتار أو 5.5 متر.</p>",
        "<h2>أي طول يناسب مهمتك؟</h2><p>طابق الطول مع حاجة القياس قبل طلب عرض السعر. بمجرد تحديد المنتج المناسب، راجع صفحة المنتج المحددة وتأكد من الاختيار النهائي.</p>",
      ],
    },
    seoTitle: {
      en: "How to Choose a Measuring Tape Length",
      ar: "كيفية اختيار طول شريط القياس",
    },
    seoDescription: {
      en: "Use the measuring-tape category to compare the 5M, 5.5M and 7.5M options and choose the right length for your task.",
      ar: "استخدم فئة أشرطة القياس لمقارنة خيارات 5 أمتار و5.5 متر و7.5 متر واختيار الطول المناسب لمهمتك.",
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
      en: "A catalogue-backed guide for exploring the Pajama category and reviewing the product entry before you enquire.",
      ar: "دليل مبني على الكتالوج لاستكشاف فئة البيجاما ومراجعة إدخال المنتج قبل الاستفسار.",
    },
    summary: {
      en: "The Pajama category is the clearest starting point when a shopper is reviewing sleepwear or relaxed homewear in the Qasr Al Mabrook collection.",
      ar: "تعد فئة البيجاما نقطة البداية الأنسب عندما يقوم المتسوق بمراجعة ملابس النوم أو الملابس المنزلية المريحة في مجموعة قصر المبارك.",
    },
    body: {
      en: [
        "<h2>Start with the Pajama category</h2><p>The <a href=\"/en/categories/pajama\">Pajama category</a> is the clearest entry point for shoppers who are focused on sleepwear and relaxed homewear browsing. It provides the category context before a buyer reviews the specific product record.</p>",
        "<h2>Check the product entry</h2><p>The <a href=\"/en/products/pajama\">Pajama product page</a> confirms the exact item in the catalogue and places it inside the broader product range. This helps the shopper review the item without making assumptions beyond the catalogue content.</p>",
        "<h2>When the Pajama category is the right fit</h2><p>If the shopping need is connected to personal wear, sleepwear, or relaxed homewear, the Pajama category is the most relevant place to begin. After reviewing the product page, the next practical step is to request a quote if the item matches the intended need.</p>",
      ],
      ar: [
        "<h2>ابدأ بفئة البيجاما</h2><p>تعد <a href=\"/ar/categories/pajama\">فئة البيجاما</a> نقطة الدخول الأنسب للمتسوقين الذين يركزون على تصفح ملابس النوم والملابس المنزلية المريحة. فهي توفر السياق الفئوي قبل أن يراجع المشتري السجل المحدد للمنتج.</p>",
        "<h2>راجع إدخال المنتج</h2><p>تؤكد <a href=\"/ar/products/pajama\">صفحة منتج البيجاما</a> العنصر الدقيق في الكتالوج وتضعه داخل النطاق الأوسع للمنتجات. وهذا يساعد المتسوق على مراجعة العنصر دون افتراضات تتجاوز محتوى الكتالوج.</p>",
        "<h2>متى تكون فئة البيجاما مناسبة</h2><p>إذا كان الاحتياج مرتبطًا بملابس الشخصية أو ملابس النوم أو الملابس المنزلية المريحة، ففئة البيجاما هي المكان الأكثر صلة للبدء. وبعد مراجعة صفحة المنتج، تكون الخطوة العملية التالية طلب عرض سعر إذا كان العنصر مناسبًا للاحتياج المقصود.</p>",
      ],
    },
    seoTitle: {
      en: "Pajama Buying Guide for Everyday Wear",
      ar: "دليل شراء البيجاما للاستخدام اليومي",
    },
    seoDescription: {
      en: "Review the Pajama category and product entry in the Qasr Al Mabrook catalogue before requesting a quote or continuing your browse.",
      ar: "راجع فئة البيجاما وإدخال المنتج في كتالوج قصر المبارك قبل طلب عرض السعر أو متابعة التصفح.",
    },
  },
  {
    slug: "cloth-piece-guide",
    publishedAt: "2026-10-02",
    updatedAt: "2026-10-02",
    featuredImage: "/catalogue/Cloth%20Piece/Cloth%20Piece-%2301.jpg",
    title: {
      en: "Cloth Pieces: A Guide to the Catalogue Category",
      ar: "قطع القماش: دليل لفئة الكتالوج",
    },
    excerpt: {
      en: "A catalogue-focused guide explaining the Cloth Piece category and its place in garment and textile-related browsing.",
      ar: "دليل يركز على الكتالوج يشرح فئة قطع القماش ومكانها في التصفح المرتبط بالملابس والنسيج.",
    },
    summary: {
      en: "The Cloth Piece category is most useful when it is reviewed as a catalogue section in context, with the product page used to confirm the exact entry.",
      ar: "تكون فئة قطع القماش أكثر فائدة عندما تُراجع كقسم كتالوج ضمن السياق، مع استخدام صفحة المنتج لتأكيد الإدخال الدقيق.",
    },
    body: {
      en: [
        "<h2>What the Cloth Piece category shows</h2><p>The <a href=\"/en/categories/cloth-piece\">Cloth Piece category</a> is the right starting point for textile and garment-related catalogue browsing. It puts the product in context before the shopper reaches the specific record.</p>",
        "<h2>Review the product in context</h2><p>The <a href=\"/en/products/cloth-piece\">Cloth Piece product page</a> confirms the exact catalogue entry and helps a shopper understand the product inside the broader category structure. This makes the review more grounded and useful for project-based browsing.</p>",
        "<h2>When this category is relevant</h2><p>This category is most relevant when the shopping need is connected to fabric, textile, or garment projects. After reviewing the section and product page, the next practical step is to request a quote if the item fits the project.</p>",
      ],
      ar: [
        "<h2>ما الذي تظهره فئة قطع القماش</h2><p>تعد <a href=\"/ar/categories/cloth-piece\">فئة قطع القماش</a> نقطة البداية المناسبة لتصفح الكتالوج المرتبط بالنسيج والملابس. فهي تضع المنتج في سياقه قبل أن يصل المتسوق إلى السجل المحدد.</p>",
        "<h2>راجع المنتج ضمن السياق</h2><p>تؤكد <a href=\"/ar/products/cloth-piece\">صفحة منتج قطعة القماش</a> الإدخال الدقيق في الكتالوج وتساعد المتسوق على فهم المنتج داخل هيكل الفئة الأوسع. وهذا يجعل المراجعة أكثر واقعية وفائدة للتصفح المرتبط بالمشاريع.</p>",
        "<h2>متى تكون هذه الفئة مناسبة</h2><p>تكون هذه الفئة أكثر صلة عندما يرتبط احتياج الشراء بالأقمشة أو النسيج أو مشاريع الملابس. وبعد مراجعة القسم وصفحة المنتج، تكون الخطوة العملية التالية طلب عرض سعر إذا كان العنصر مناسبًا للمشروع.</p>",
      ],
    },
    seoTitle: {
      en: "Cloth Pieces: A Guide to the Catalogue Category",
      ar: "قطع القماش: دليل لفئة الكتالوج",
    },
    seoDescription: {
      en: "Learn how the Cloth Piece category is presented in the Qasr Al Mabrook catalogue and review the product entry before enquiring.",
      ar: "تعرف على كيفية تقديم فئة قطع القماش في كتالوج قصر المبارك ومراجعة إدخال المنتج قبل الاستفسار.",
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
      ar: "دليل كتالوجي لمراجعة فئة البدلات الفاخرة والإدخال المقابل لها في مجموعة قصر المبارك.",
    },
    summary: {
      en: "The strongest review path is to start in the Fancy Suit category, confirm the product page, and then move to the enquiry if it matches the need.",
      ar: "أقوى مسار مراجعة هو البدء بفئة البدلات الفاخرة، ثم تأكيد صفحة المنتج، ثم الانتقال إلى الاستفسار إذا كان مناسبًا للاحتياج.",
    },
    body: {
      en: [
        "<h2>What to review in the Fancy Suit category</h2><p>The <a href=\"/en/categories/fancy-suit\">Fancy Suit category</a> is the clearest starting point when a shopper wants to review occasion-based or formal-style catalogue entries. It offers the category context before the exact product page is examined.</p>",
        "<h2>Check the product entry</h2><p>The <a href=\"/en/products/fancy-suit\">Fancy Suit product page</a> provides the exact item record and helps the shopper understand how it sits inside the broader catalogue. This makes the review more grounded and easier to act on.</p>",
        "<h2>When this category fits a customer need</h2><p>If the shopper is looking for a formal, occasion, or statement-style outfit within the available catalogue, the Fancy Suit category is the most relevant place to begin. From there, the next step is to confirm the product page and request a quote if needed.</p>",
      ],
      ar: [
        "<h2>ما الذي يجب مراجعته في فئة البدلات الفاخرة</h2><p>تعد <a href=\"/ar/categories/fancy-suit\">فئة البدلات الفاخرة</a> نقطة البداية الأنسب عندما يريد المتسوق مراجعة إدخالات الكتالوج المرتبطة بالمناسبات أو الأنماط الرسمية. فهي توفر سياق الفئة قبل فحص صفحة المنتج المحددة.</p>",
        "<h2>راجع إدخال المنتج</h2><p>توفر <a href=\"/ar/products/fancy-suit\">صفحة منتج البدلة الفاخرة</a> السجل الدقيق للعنصر وتساعد المتسوق على فهم مكانه داخل الكتالوج الأوسع. وهذا يجعل المراجعة أكثر واقعية وأسهل في التنفيذ.</p>",
        "<h2>متى تكون هذه الفئة مناسبة لاحتياج العميل</h2><p>إذا كان المتسوق يبحث عن زي رسمي أو مناسب للمناسبات أو إطلالة أكثر تميزًا ضمن الكتالوج المتاح، ففئة البدلات الفاخرة هي المكان الأنسب للبدء. ومن هناك، تكون الخطوة التالية تأكيد صفحة المنتج وطلب عرض سعر عند الحاجة.</p>",
      ],
    },
    seoTitle: {
      en: "Exploring Fancy Suit Options in the Catalogue",
      ar: "استكشاف خيارات البدلات الفاخرة في الكتالوج",
    },
    seoDescription: {
      en: "Review the Fancy Suit category and product entry in the Qasr Al Mabrook catalogue before you enquire about the item.",
      ar: "راجع فئة البدلات الفاخرة وإدخال المنتج في كتالوج قصر المبارك قبل الاستفسار عن العنصر.",
    },
  },
  {
    slug: "adivasi-oil-overview",
    publishedAt: "2026-10-02",
    updatedAt: "2026-10-02",
    featuredImage: "/catalogue/Adivasi%20Oil/Adivasi%20Oil-%2301.jpg",
    title: {
      en: "Adivasi Oil: Product Overview and Catalogue Information",
      ar: "زيت أديفاسي: نظرة عامة على المنتج ومعلومات الكتالوج",
    },
    excerpt: {
      en: "A factual overview of the Adivasi Oil entry in the Qasr Al Mabrook catalogue, including its category placement and product listing.",
      ar: "نظرة واقعية على إدخال زيت أديفاسي في كتالوج قصر المبارك، بما في ذلك مكانه داخل الفئة وسجل المنتج.",
    },
    summary: {
      en: "This overview keeps the article factual and catalogue-led, reviewing the Adivasi Oil entry in context without adding unsupported claims.",
      ar: "تُبقي هذه النظرة المقال واقعيًا وموجهًا إلى الكتالوج، وتراجع إدخال زيت أديفاسي ضمن السياق دون إضافة ادعاءات غير مدعومة.",
    },
    body: {
      en: [
        "<h2>What the Adivasi Oil catalogue entry includes</h2><p>The most accurate way to review <a href=\"/en/categories/adivasi-oil\">Adivasi Oil</a> in this catalogue is to treat it as a published product entry placed within a category context. The category and product pages show where it sits in the collection and how it is presented to shoppers.</p>",
        "<h2>How to review the product in context</h2><p>Because the catalogue content is the primary source of information, the most responsible approach is to compare the product page to the category entry without extending the review beyond the published data. This keeps the overview grounded in the actual catalogue record.</p>",
        "<h2>Move to the product page or enquiry flow</h2><p>For customers who want to continue the journey, the next step is to open the <a href=\"/en/products/adivasi-oil\">Adivasi Oil product page</a> and then request a quote if the product matches their need.</p>",
      ],
      ar: [
        "<h2>ما الذي يتضمنه إدخال زيت أديفاسي في الكتالوج</h2><p>أقرب طريقة دقيقة لمراجعة <a href=\"/ar/categories/adivasi-oil\">زيت أديفاسي</a> في هذا الكتالوج هي التعامل معه كإدخال منتج منشور وضع داخل السياق الفئوي. توضح صفحة الفئة وصفحة المنتج المكان الذي يحتله داخل المجموعة وكيفية تقديمه للمشترين.</p>",
        "<h2>كيفية مراجعة المنتج ضمن السياق</h2><p>نظرًا لأن محتوى الكتالوج هو المصدر الرئيسي للمعلومات، فإن أكثر طريقة مسؤولة هي مقارنة صفحة المنتج بإدخال الفئة دون توسيع المراجعة خارج البيانات المنشورة. وهذا يبقي النظرة متوافقة مع سجل الكتالوج الفعلي.</p>",
        "<h2>انتقل إلى صفحة المنتج أو تدفق الاستفسار</h2><p>للعملاء الذين يرغبون في متابعة الرحلة، تكون الخطوة التالية فتح <a href=\"/ar/products/adivasi-oil\">صفحة منتج زيت أديفاسي</a> ومن ثم طلب عرض سعر إذا كان المنتج مناسبًا لاحتياجهم.</p>",
      ],
    },
    seoTitle: {
      en: "Adivasi Oil: Product Overview and Catalogue Information",
      ar: "زيت أديفاسي: نظرة عامة على المنتج ومعلومات الكتالوج",
    },
    seoDescription: {
      en: "Review the Adivasi Oil entry in the Qasr Al Mabrook catalogue and understand how it is presented in the published collection.",
      ar: "راجع إدخال زيت أديفاسي في كتالوج قصر المبارك وفهم كيفية تقديمه في المجموعة المنشورة.",
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
    seoDescription: article.seoDescription?.[currentLocale] ?? article.excerpt[currentLocale],
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
