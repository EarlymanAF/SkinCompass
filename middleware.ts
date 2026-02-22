// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PUBLIC_ROUTES = new Set(["/", "/impressum", "/datenschutz"]);
const LANDING_ONLY_MODE = process.env.LANDING_ONLY_MODE !== "false";

export function middleware(req: NextRequest) {
  if (!LANDING_ONLY_MODE) {
    return NextResponse.next();
  }

  // Never intercept internal Next.js routes like /_error, /_not-found, /_next, etc.
  if (req.nextUrl.pathname.startsWith("/_")) {
    return NextResponse.next();
  }

  if (PUBLIC_ROUTES.has(req.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = "/";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico|robots.txt|sitemap.xml|icon.png|.*\\..*).*)"],
};
