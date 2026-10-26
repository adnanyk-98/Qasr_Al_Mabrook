import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

if (process.env.CI !== "true" || process.env.GITHUB_ACTIONS !== "true") {
  throw new Error("Test database fixtures may only be seeded by GitHub Actions.");
}

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to seed CI test fixtures.");
}

const target = new URL(databaseUrl);
if (
  !["postgres:", "postgresql:"].includes(target.protocol) ||
  !["localhost", "127.0.0.1"].includes(target.hostname) ||
  target.port !== "5432" ||
  target.username !== "qam_test" ||
  target.pathname !== "/qam_test"
) {
  throw new Error("Refusing to seed a database outside the disposable CI test target.");
}

const sql = postgres(databaseUrl, { max: 1, ssl: false });

async function seedTestDatabase() {
  try {
    await sql.begin(async (transaction) => {
      await transaction`
      INSERT INTO categories (id, slug, status, sort_order, created_at, updated_at)
      VALUES
        ('10000000-0000-0000-0000-000000000001', 'measuring-tape', 'PUBLISHED', 1, '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z'),
        ('10000000-0000-0000-0000-000000000002', 'gloves', 'PUBLISHED', 2, '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z'),
        ('10000000-0000-0000-0000-000000000003', 'test-draft-category', 'DRAFT', 3, '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z')
      ON CONFLICT (id) DO UPDATE SET
        slug = EXCLUDED.slug,
        status = EXCLUDED.status,
        sort_order = EXCLUDED.sort_order,
        updated_at = EXCLUDED.updated_at
    `;

      await transaction`
      INSERT INTO category_translations (id, category_id, locale, name)
      VALUES
        ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'en', 'Measuring Tapes'),
        ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'ar', 'أدوات القياس'),
        ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'en', 'Gloves'),
        ('30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'ar', 'قفازات'),
        ('30000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003', 'en', 'Draft Test Category')
      ON CONFLICT (id) DO UPDATE SET
        category_id = EXCLUDED.category_id,
        locale = EXCLUDED.locale,
        name = EXCLUDED.name
    `;

      await transaction`
      INSERT INTO brands (id, slug, name, enabled, status, sort_order)
      VALUES
        ('50000000-0000-0000-0000-000000000001', 'test-yokohama', 'Yokohama', true, 'PUBLISHED', 1),
        ('50000000-0000-0000-0000-000000000002', 'test-dpl', 'DPL', true, 'PUBLISHED', 2),
        ('50000000-0000-0000-0000-000000000003', 'test-hidden-brand', 'Hidden Test Brand', true, 'DRAFT', 3)
      ON CONFLICT (id) DO UPDATE SET
        slug = EXCLUDED.slug,
        name = EXCLUDED.name,
        enabled = EXCLUDED.enabled,
        status = EXCLUDED.status,
        sort_order = EXCLUDED.sort_order
    `;

      await transaction`
      INSERT INTO brand_translations (id, brand_id, locale, name)
      VALUES
        ('60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'en', 'Yokohama'),
        ('60000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002', 'en', 'DPL'),
        ('60000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000002', 'ar', 'دي بي إل'),
        ('60000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000003', 'en', 'Hidden Test Brand'),
        ('60000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000003', 'ar', 'علامة اختبار مخفية')
      ON CONFLICT (id) DO UPDATE SET
        brand_id = EXCLUDED.brand_id,
        locale = EXCLUDED.locale,
        name = EXCLUDED.name
    `;

      await transaction`
      INSERT INTO products (id, slug, brand_id, status, default_sku, published_at, created_at, updated_at)
      VALUES
        ('20000000-0000-0000-0000-000000000001', '5m-measuring-tape-green', '50000000-0000-0000-0000-000000000001', 'PUBLISHED', 'TEST-TAPE-5M', '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z'),
        ('20000000-0000-0000-0000-000000000002', 'dpl-gloves-test', '50000000-0000-0000-0000-000000000002', 'PUBLISHED', 'TEST-DPL-G70', '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z'),
        ('20000000-0000-0000-0000-000000000003', 'draft-measuring-tape-test', '50000000-0000-0000-0000-000000000001', 'DRAFT', 'TEST-DRAFT-TAPE', NULL, '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z'),
        ('20000000-0000-0000-0000-000000000004', 'draft-category-relation-test', NULL, 'PUBLISHED', 'TEST-DRAFT-CATEGORY-RELATION', '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z')
      ON CONFLICT (id) DO UPDATE SET
        slug = EXCLUDED.slug,
        brand_id = EXCLUDED.brand_id,
        status = EXCLUDED.status,
        default_sku = EXCLUDED.default_sku,
        published_at = EXCLUDED.published_at,
        updated_at = EXCLUDED.updated_at
    `;

      await transaction`
      INSERT INTO product_translations (id, product_id, locale, name, short_description)
      VALUES
        ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'en', '5M Measuring Tape Green', 'Test fixture for published catalogue search.'),
        ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'ar', 'شريط قياس 5 أمتار', 'بيانات اختبار للكتالوج.'),
        ('40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', 'en', 'DPL Grandeur 70 Gloves', 'Test fixture for published catalogue routes.'),
        ('40000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000002', 'ar', 'قفازات DPL Grandeur 70', 'بيانات اختبار للكتالوج.'),
        ('40000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000003', 'en', 'Draft Measuring Tape'),
        ('40000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000003', 'ar', 'شريط قياس مسودة'),
        ('40000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000004', 'en', 'Draft Category Relation Test Product'),
        ('40000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000004', 'ar', 'منتج اختبار بفئة مسودة')
      ON CONFLICT (id) DO UPDATE SET
        product_id = EXCLUDED.product_id,
        locale = EXCLUDED.locale,
        name = EXCLUDED.name,
        short_description = EXCLUDED.short_description
    `;

      const productIds = [
        "20000000-0000-0000-0000-000000000001",
        "20000000-0000-0000-0000-000000000002",
        "20000000-0000-0000-0000-000000000003",
        "20000000-0000-0000-0000-000000000004",
      ];

      for (const productId of productIds) {
        await transaction`DELETE FROM product_categories WHERE product_id = ${productId}`;
      }

      await transaction`
      INSERT INTO product_categories (product_id, category_id, is_primary)
      VALUES
        ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', true),
        ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', true),
        ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', true),
        ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000003', true)
    `;
    });

    console.log(
      "Seeded deterministic catalogue fixtures in the disposable CI database.",
    );
  } finally {
    await sql.end();
  }
}

void seedTestDatabase().catch((error: unknown) => {
  console.error("Unable to seed disposable CI test fixtures:", error);
  process.exitCode = 1;
});
