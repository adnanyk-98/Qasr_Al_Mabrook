import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { localePath, type Locale } from "@/lib/locales";
import { getTranslations } from "next-intl/server";

export async function SearchForm({ locale, defaultValue = "" }: { locale: Locale; defaultValue?: string }) {
  const t = await getTranslations({ locale, namespace: "search" });
  return (
    <form action={localePath(locale, "/search")} method="get" className="flex w-full max-w-md items-center gap-2">
      <Input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={t("placeholder")}
        aria-label={t("label")}
        className="h-10 rounded-full border-[var(--brand-border)] bg-white"
      />
      <Button type="submit" variant="primary" size="sm" className="shrink-0 rounded-full">
        {t("eyebrow")}
      </Button>
    </form>
  );
}
