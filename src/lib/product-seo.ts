import { z } from "zod";

export const productSeoFieldsSchema = z.object({
  seoTitle: z
    .string()
    .trim()
    .max(255, "SEO title must be 255 characters or fewer.")
    .optional()
    .default(""),
  seoDescription: z
    .string()
    .trim()
    .max(140, "SEO description must be 140 characters or fewer.")
    .optional()
    .default(""),
});
