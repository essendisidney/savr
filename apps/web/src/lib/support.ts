export function supportEmail(): string {
  return (process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@savr.app").trim();
}

export function supportMailto(): string {
  return `mailto:${supportEmail()}`;
}

/** Optional WhatsApp: E.164 digits or full wa.me URL. */
export function supportWhatsAppUrl(): string | null {
  const raw = (process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "").trim();
  if (!raw) return null;
  if (raw.startsWith("http")) return raw;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}
