import { db } from "@/db";
import { siteSettings } from "@/db/schema";

const defaultSettings = [
  { key: "business_phone", valueJson: { value: "" } },
  { key: "business_email", valueJson: { value: "" } },
  { key: "whatsapp_number", valueJson: { value: "" } },
  { key: "address", valueJson: { value: "" } },
  { key: "seo_defaults", valueJson: { defaultTitle: "Qasr Al Mabrook" } },
] as const;

export async function seedDatabase() {
  for (const setting of defaultSettings) {
    await db
      .insert(siteSettings)
      .values({
        key: setting.key,
        valueJson: setting.valueJson,
      })
      .onConflictDoNothing({ target: siteSettings.key });
  }
}
