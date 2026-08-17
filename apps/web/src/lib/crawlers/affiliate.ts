/** Jumia Partner Network tag — only appended when set. Never invent affiliate IDs. */
export function withJumiaPartnerTag(url: string): string {
  const tag = (process.env.JUMIA_AFFILIATE_TAG ?? "").trim();
  if (!tag) return url;
  try {
    const u = new URL(url);
    if (!u.searchParams.has("sid")) u.searchParams.set("sid", tag);
    return u.toString();
  } catch {
    return url;
  }
}
