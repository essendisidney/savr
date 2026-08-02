/** Normalize Kenya mobile numbers to E.164 (+254…). */
export function toE164Kenya(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, "").trim();
  if (!digits) return null;

  let n = digits;
  if (n.startsWith("+")) n = n.slice(1);
  if (n.startsWith("0") && n.length === 10) n = `254${n.slice(1)}`;
  else if (n.length === 9 && /^[17]/.test(n)) n = `254${n}`;
  else if (n.startsWith("254") && n.length === 12) {
    /* already */
  } else if (n.startsWith("254") && n.length > 12) {
    return null;
  } else {
    return null;
  }

  if (!/^254[17]\d{8}$/.test(n)) return null;
  return `+${n}`;
}

export function formatPhoneHint(raw: string): string {
  const e164 = toE164Kenya(raw);
  return e164 ?? raw.trim();
}
