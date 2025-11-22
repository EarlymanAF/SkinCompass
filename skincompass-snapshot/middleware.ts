// middleware.ts
import { NextRequest, NextResponse } from "next/server";

/** Holt die Client-IP aus Standard-Headern (und fällt notfalls weich zurück). */
function getClientIp(req: NextRequest): string | undefined {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) {
    // kann mehrere IPs enthalten: "client, proxy1, proxy2"
    const first = xf.split(",")[0]?.trim();
    if (first) return first;
  }
  const xr = req.headers.get("x-real-ip");
  if (xr) return xr;

  // Manche Plattformen setzen req.ip zur Laufzeit – TS kennt das Feld aber nicht.
  // Wir greifen nur optional darauf zu.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const maybeIp = (req as any)?.ip as string | undefined;
  if (maybeIp) return maybeIp;

  return undefined;
}

export function middleware(req: NextRequest) {
  const ip = getClientIp(req);
  // Beispiel: Du könntest hier Rate Limiting / Logging / Geo-Routing etc. machen.
  // console.log("Client IP:", ip ?? "unbekannt");

  return NextResponse.next();
}

// Passe das Matching nach Bedarf an (hier: alles außer Next-Assets/Icons)
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png).*)"],
};