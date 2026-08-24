import { boolean, integer, jsonb, numeric, pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const entityStatusEnum = pgEnum("entity_status", ["DRAFT", "PUBLISHED", "ARCHIVED"]);
export const localeEnum = pgEnum("locale", ["en", "ar"]);
export const dataTypeEnum = pgEnum("attribute_data_type", ["TEXT", "NUMBER", "BOOLEAN", "SELECT", "MULTI_SELECT", "COLOR"]);
export const specificationDataTypeEnum = pgEnum("specification_data_type", ["TEXT", "NUMBER", "BOOLEAN"]);
export const quoteStatusEnum = pgEnum("quote_status", ["NEW", "IN_PROGRESS", "RESPONDED", "CLOSED", "SPAM"]);
export const sourceTypeEnum = pgEnum("quote_source", ["PRODUCT", "CONTACT"]);

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  parentId: uuid("parent_id"),
  slug: varchar("slug", { length: 255 }).notNull(),
  status: entityStatusEnum("status").notNull().default("DRAFT"),
  imageObjectKey: text("image_object_key"),
  imagePublicUrl: text("image_public_url"),
  imageWidth: integer("image_width"),
  imageHeight: integer("image_height"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const categoryTranslations = pgTable("category_translations", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoryId: uuid("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  locale: localeEnum("locale").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  seoTitle: varchar("seo_title", { length: 255 }),
  seoDescription: text("seo_description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const brands = pgTable("brands", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  status: entityStatusEnum("status").notNull().default("DRAFT"),
  logoImageId: uuid("logo_image_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const brandTranslations = pgTable("brand_translations", {
  id: uuid("id").primaryKey().defaultRandom(),
  brandId: uuid("brand_id").notNull().references(() => brands.id, { onDelete: "cascade" }),
  locale: localeEnum("locale").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  seoTitle: varchar("seo_title", { length: 255 }),
  seoDescription: text("seo_description"),
});

export const attributes = pgTable("attributes", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 255 }).notNull().unique(),
  dataType: dataTypeEnum("data_type").notNull(),
  isVariantDefining: boolean("is_variant_defining").notNull().default(false),
  isFilterable: boolean("is_filterable").notNull().default(false),
  isSearchable: boolean("is_searchable").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  status: entityStatusEnum("status").notNull().default("DRAFT"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const attributeTranslations = pgTable("attribute_translations", {
  id: uuid("id").primaryKey().defaultRandom(),
  attributeId: uuid("attribute_id").notNull().references(() => attributes.id, { onDelete: "cascade" }),
  locale: localeEnum("locale").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
});

export const attributeValues = pgTable("attribute_values", {
  id: uuid("id").primaryKey().defaultRandom(),
  attributeId: uuid("attribute_id").notNull().references(() => attributes.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 255 }).notNull(),
  rawValue: varchar("raw_value", { length: 255 }),
  numericValue: numeric("numeric_value"),
  sortOrder: integer("sort_order").notNull().default(0),
  status: entityStatusEnum("status").notNull().default("DRAFT"),
});

export const attributeValueTranslations = pgTable("attribute_value_translations", {
  id: uuid("id").primaryKey().defaultRandom(),
  attributeValueId: uuid("attribute_value_id").notNull().references(() => attributeValues.id, { onDelete: "cascade" }),
  locale: localeEnum("locale").notNull(),
  label: varchar("label", { length: 255 }).notNull(),
});

export const categoryAttributes = pgTable("category_attributes", {
  categoryId: uuid("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  attributeId: uuid("attribute_id").notNull().references(() => attributes.id, { onDelete: "cascade" }),
  isRequired: boolean("is_required").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  brandId: uuid("brand_id"),
  status: entityStatusEnum("status").notNull().default("DRAFT"),
  defaultSku: varchar("default_sku", { length: 255 }),
  primaryImageId: uuid("primary_image_id"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const productTranslations = pgTable("product_translations", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  locale: localeEnum("locale").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  shortDescription: text("short_description"),
  description: text("description"),
  seoTitle: varchar("seo_title", { length: 255 }),
  seoDescription: text("seo_description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const productCategories = pgTable("product_categories", {
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  isPrimary: boolean("is_primary").notNull().default(false),
});

export const productAttributeValues = pgTable("product_attribute_values", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  attributeId: uuid("attribute_id").notNull().references(() => attributes.id, { onDelete: "cascade" }),
  attributeValueId: uuid("attribute_value_id"),
  textValue: text("text_value"),
  numericValue: numeric("numeric_value"),
  booleanValue: boolean("boolean_value"),
});

export const productImages = pgTable("product_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  objectKey: text("object_key").notNull(),
  publicUrl: text("public_url").notNull(),
  altTextEn: text("alt_text_en"),
  altTextAr: text("alt_text_ar"),
  width: integer("width"),
  height: integer("height"),
  sortOrder: integer("sort_order").notNull().default(0),
  isPrimary: boolean("is_primary").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const variantDefinitions = pgTable("variant_definitions", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  attributeId: uuid("attribute_id").notNull().references(() => attributes.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const variantCombinations = pgTable("variant_combinations", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  sku: varchar("sku", { length: 255 }).notNull(),
  status: entityStatusEnum("status").notNull().default("DRAFT"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const variantCombinationValues = pgTable("variant_combination_values", {
  variantCombinationId: uuid("variant_combination_id").notNull().references(() => variantCombinations.id, { onDelete: "cascade" }),
  attributeId: uuid("attribute_id").notNull().references(() => attributes.id, { onDelete: "cascade" }),
  attributeValueId: uuid("attribute_value_id").notNull().references(() => attributeValues.id, { onDelete: "cascade" }),
});

export const variantImages = pgTable("variant_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  variantCombinationId: uuid("variant_combination_id").notNull().references(() => variantCombinations.id, { onDelete: "cascade" }),
  objectKey: text("object_key").notNull(),
  publicUrl: text("public_url").notNull(),
  altTextEn: text("alt_text_en"),
  altTextAr: text("alt_text_ar"),
  width: integer("width"),
  height: integer("height"),
  sortOrder: integer("sort_order").notNull().default(0),
  isPrimary: boolean("is_primary").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const specificationDefinitions = pgTable("specification_definitions", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 255 }).notNull().unique(),
  dataType: specificationDataTypeEnum("data_type").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  status: entityStatusEnum("status").notNull().default("DRAFT"),
});

export const specificationTranslations = pgTable("specification_translations", {
  id: uuid("id").primaryKey().defaultRandom(),
  specificationDefinitionId: uuid("specification_definition_id").notNull().references(() => specificationDefinitions.id, { onDelete: "cascade" }),
  locale: localeEnum("locale").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
});

export const productSpecifications = pgTable("product_specifications", {
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  specificationDefinitionId: uuid("specification_definition_id").notNull().references(() => specificationDefinitions.id, { onDelete: "cascade" }),
  valueText: text("value_text"),
  valueNumeric: numeric("value_numeric"),
  valueBoolean: boolean("value_boolean"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const variantSpecifications = pgTable("variant_specifications", {
  variantCombinationId: uuid("variant_combination_id").notNull().references(() => variantCombinations.id, { onDelete: "cascade" }),
  specificationDefinitionId: uuid("specification_definition_id").notNull().references(() => specificationDefinitions.id, { onDelete: "cascade" }),
  valueText: text("value_text"),
  valueNumeric: numeric("value_numeric"),
  valueBoolean: boolean("value_boolean"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const quoteRequests = pgTable("quote_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  referenceNumber: varchar("reference_number", { length: 255 }).notNull().unique(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerEmail: varchar("customer_email", { length: 255 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 255 }).notNull(),
  companyName: varchar("company_name", { length: 255 }),
  city: varchar("city", { length: 255 }),
  country: varchar("country", { length: 255 }),
  message: text("message"),
  status: quoteStatusEnum("status").notNull().default("NEW"),
  source: sourceTypeEnum("source").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const quoteRequestItems = pgTable("quote_request_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  quoteRequestId: uuid("quote_request_id").notNull().references(() => quoteRequests.id, { onDelete: "cascade" }),
  productId: uuid("product_id"),
  variantCombinationId: uuid("variant_combination_id"),
  productNameSnapshot: varchar("product_name_snapshot", { length: 255 }).notNull(),
  skuSnapshot: varchar("sku_snapshot", { length: 255 }),
  quantity: integer("quantity"),
  notes: text("notes"),
});
