import { pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { quoteRequests } from "./catalog";

export const quoteRequestNotifications = pgTable("quote_request_notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  quoteRequestId: uuid("quote_request_id").notNull().references(() => quoteRequests.id, { onDelete: "cascade" }),
  channel: varchar("channel", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("PENDING"),
  payloadJson: text("payload_json"),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
