import { jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { localeEnum } from "./catalog";

export const homepageSections = pgTable("homepage_sections", {
  id: uuid("id").primaryKey().defaultRandom(),
  sectionType: varchar("section_type", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("DRAFT"),
  sortOrder: varchar("sort_order", { length: 20 }).notNull().default("0"),
  configurationJson: jsonb("configuration_json").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const staticPages = pgTable("static_pages", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  status: varchar("status", { length: 50 }).notNull().default("DRAFT"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const staticPageTranslations = pgTable("static_page_translations", {
  id: uuid("id").primaryKey().defaultRandom(),
  staticPageId: uuid("static_page_id").notNull().references(() => staticPages.id, { onDelete: "cascade" }),
  locale: localeEnum("locale").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  seoTitle: varchar("seo_title", { length: 255 }),
  seoDescription: text("seo_description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
