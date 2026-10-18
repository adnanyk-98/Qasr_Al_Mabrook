const INTERNATIONAL_PHONE_PATTERN =
  /^(?:\+|00)\s*(?:\d+|\(\d+\))(?:[ .-]?(?:\d+|\(\d+\)))*$/;

function normalizeInternationalPhoneNumber(phone: string): string | null {
  const trimmed = phone.trim();
  if (!INTERNATIONAL_PHONE_PATTERN.test(trimmed)) return null;

  const number = trimmed.startsWith("00") ? trimmed.slice(2) : trimmed.slice(1);
  const digits = number.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15 || digits.startsWith("0")) return null;

  return `+${digits}`;
}

export function formatPublicPhoneNumber(phone: string): string {
  const normalizedNumber = normalizeInternationalPhoneNumber(phone);
  if (!normalizedNumber) return phone;

  const uaeNumber = normalizedNumber.match(/^\+971(\d{2})(\d{3})(\d{4})$/);
  return uaeNumber ? `+971 ${uaeNumber[1]} ${uaeNumber[2]} ${uaeNumber[3]}` : phone;
}

export function buildTelephoneHref(phone: string): string | null {
  const normalizedNumber = normalizeInternationalPhoneNumber(phone);
  return normalizedNumber ? `tel:${normalizedNumber}` : null;
}
