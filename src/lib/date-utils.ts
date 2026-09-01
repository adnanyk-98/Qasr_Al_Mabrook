/**
 * Format a date for consistent server-side and client-side rendering.
 * Uses a fixed DD/MM/YYYY format to avoid hydration mismatches from locale-dependent APIs.
 *
 * @param date - Date object or string to format
 * @returns Formatted date string in DD/MM/YYYY format, or "Never" if date is null/undefined
 */
export function formatDateConsistent(date: Date | string | null | undefined): string {
  if (!date) return "Never";

  const d = typeof date === "string" ? new Date(date) : date;

  // Safeguard against invalid dates
  if (isNaN(d.getTime())) return "Never";

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
}
