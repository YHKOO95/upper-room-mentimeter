import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PREFIXES = ["/admin", "/present", "/responses"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  if (request.cookies.has("ur-admin")) return NextResponse.next();

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/present/:path*", "/responses/:path*"],
};
