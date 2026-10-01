// ─────────────────────────────────────────────────────────────────────────────
// proxy.ts — Next.js 16 equivalent of middleware.ts
// Runs on the edge; only checks cookie *presence* (not DynamoDB validity).
// Full session validation happens in Route Handlers and Server Components.
// ─────────────────────────────────────────────────────────────────────────────
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "sbg_session";

// Routes that require an authenticated session
const PROTECTED_PREFIXES = ["/dashboard", "/events"];

// Routes accessible only when NOT authenticated
const AUTH_ONLY_PREFIXES = ["/login"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession   = request.cookies.has(COOKIE_NAME);

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthOnly  = AUTH_ONLY_PREFIXES.some((p) => pathname.startsWith(p));

  // No session → redirect to /login
  if (isProtected && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // Has session → redirect away from /login
  if (isAuthOnly && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.searchParams.delete("from");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip static files, next internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
