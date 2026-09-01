import { NextResponse } from "next/server";

import { createHomepageSection, getHomepageSectionById, updateHomepageSection } from "@/server/repositories/catalog-admin";
import { getCurrentAdmin } from "@/server/services/admin-auth";

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.redirect(new URL("/admin/login", request.url), 303);
  }

  const formData = await request.formData();
  const sectionId = String(formData.get("sectionId") ?? "").trim();
  const sectionType = String(formData.get("sectionType") ?? "").trim();
  const status = String(formData.get("status") ?? "DRAFT");
  const sortOrder = String(formData.get("sortOrder") ?? "0");

  let existingDesktopImageUrl = "";
  let existingMobileImageUrl = "";
  if (sectionId) {
    const current = await getHomepageSectionById(sectionId);
    const currentConfig = (current?.configurationJson ?? {}) as Record<string, unknown>;
    existingDesktopImageUrl = typeof currentConfig.desktopImageUrl === "string" ? currentConfig.desktopImageUrl : typeof currentConfig.imageUrl === "string" ? currentConfig.imageUrl : "";
    existingMobileImageUrl = typeof currentConfig.mobileImageUrl === "string" ? currentConfig.mobileImageUrl : "";
  }

  const configurationJson: Record<string, unknown> = {
    title: String(formData.get("title") ?? ""),
    subtitle: String(formData.get("subtitle") ?? ""),
    description: String(formData.get("description") ?? ""),
    desktopImageUrl: existingDesktopImageUrl,
    mobileImageUrl: existingMobileImageUrl,
    imageAlt: String(formData.get("imageAlt") ?? ""),
    ctaLabel: String(formData.get("ctaLabel") ?? ""),
    ctaHref: String(formData.get("ctaHref") ?? ""),
    enabled: String(formData.get("enabled") ?? "") === "on",
  };

  // The file binary MUST NOT be accepted via this route anymore.
  // Binary uploads are handled by the dedicated hero-upload route.
  const providedDesktopImageUrl = String(formData.get("desktopImageUrl") ?? "").trim();
  const providedMobileImageUrl = String(formData.get("mobileImageUrl") ?? "").trim();
  if (providedDesktopImageUrl) configurationJson.desktopImageUrl = providedDesktopImageUrl;
  if (providedMobileImageUrl) configurationJson.mobileImageUrl = providedMobileImageUrl;

  if (sectionId) {
    await updateHomepageSection({
      id: sectionId,
      sectionType: sectionType || undefined,
      status: (status === "DRAFT" || status === "PUBLISHED" || status === "ARCHIVED") ? status : "DRAFT",
      sortOrder,
      configurationJson,
    });
    return NextResponse.redirect(new URL("/admin/homepage", request.url), 303);
  }

  if (!sectionType) {
    return NextResponse.redirect(new URL("/admin/homepage", request.url), 303);
  }

  await createHomepageSection({
    sectionType,
    status,
    sortOrder,
    configurationJson,
  });
  return NextResponse.redirect(new URL("/admin/homepage", request.url), 303);
}
