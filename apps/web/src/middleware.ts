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

function isProdRuntime() {
  return process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
}

/** Founder ops — hidden unless OPS_ACCESS_KEY (or invite secret fallback) is presented. */
function opsAccessKey(): string {
  return (
    (process.env.OPS_ACCESS_KEY ?? "").trim() ||
    (process.env.INVITE_COOKIE_SECRET ?? "").trim()
  );
}

function allowOps(req: NextRequest): NextResponse | null {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/ops")) return null;

  const key = opsAccessKey();
  if (!key) {
    // No key: allow locally, hide in production.
    if (isProdRuntime()) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  const cookie = req.cookies.get("savr_ops")?.value;
  const q = req.nextUrl.searchParams.get("key");
  if (cookie === key || q === key) {
    const res = NextResponse.next();
    if (q === key) {
      res.cookies.set("savr_ops", key, {
        httpOnly: true,
        sameSite: "lax",
        secure: isProdRuntime(),
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }
    return res;
  }

  return NextResponse.redirect(new URL("/", req.url));
}

export async function middleware(req: NextRequest) {
  const ops = allowOps(req);
  if (ops) return ops;

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
