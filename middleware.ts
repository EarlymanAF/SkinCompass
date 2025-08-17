import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const host = req.headers.get("host") || "";
  if (host.startsWith("www.")) {
    url.host = host.replace(/^www\./, "");
    return NextResponse.redirect(url, 301);
  }
  return NextResponse.next();
}

export const config = { matcher: "/:path*" };
