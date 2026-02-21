import { NextResponse } from "next/server";
import { auth } from "@/auth";

const PROTECTED_PREFIXES = ["/list", "/messages", "/settings"] as const;

function normalizePathname(pathname: string) {
  if (pathname !== "/" && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function isProtectedPath(pathname: string) {
  if (pathname === "/") {
    return true;
  }

  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  if (value === "/login" || value.startsWith("/api/auth")) {
    return "/";
  }
  return value;
}

export default auth((req) => {
  const pathname = normalizePathname(req.nextUrl.pathname);
  const isAuthenticated = Boolean(req.auth);

  if (isProtectedPath(pathname) && !isAuthenticated) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("next", `${pathname}${req.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && isAuthenticated) {
    const nextPath = getSafeNextPath(req.nextUrl.searchParams.get("next"));
    return NextResponse.redirect(new URL(nextPath, req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
