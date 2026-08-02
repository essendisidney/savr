import { NextResponse, type NextRequest } from "next/server";
import { INVITE_COOKIE, inviteGateEnabled, verifyInviteCookie } from "@/lib/invite-cookie";

const PUBLIC_PREFIXES = [
  "/invite",
  "/terms",
  "/privacy",
  "/login",
  "/api/auth",
  "/api/invite",
  "/api/mpesa/b2c",
  "/manifest.webmanifest",
];

function isPublic(pathname: string): boolean {
  if (pathname === "/") return true;
  if (pathname === "/sw.js") return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/icons")) return true;
  if (pathname === "/favicon.ico") return true;
  if (pathname.startsWith("/l/")) return true;
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(req: NextRequest) {
  if (!inviteGateEnabled()) {
    return NextResponse.next();
  }

  const { pathname } = req.nextUrl;
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get(INVITE_COOKIE)?.value;
  if (await verifyInviteCookie(cookie)) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = "/invite";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
