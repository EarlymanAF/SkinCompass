import { NextRequest, NextResponse } from "next/server";
import {
  createSignedSteamBridgeCode,
  parseAndVerifySteamBridgeCode,
} from "@/lib/steam-bridge-code";

const STEAM_OPENID_URL = "https://steamcommunity.com/openid/login";
const STEAM_ID_PATTERN = /^https?:\/\/steamcommunity\.com\/openid\/id\/(\d+)$/;

function normalizeUrl(value: string) {
  return value.replace(/\/$/, "");
}

function getAuthBaseUrl(req?: NextRequest) {
  const vercelUrl = process.env.VERCEL_URL;
  const configuredUrl = process.env.NEXTAUTH_URL ?? process.env.AUTH_URL;

  const host = req?.headers.get("x-forwarded-host") ?? req?.headers.get("host");
  const proto =
    req?.headers.get("x-forwarded-proto") ??
    (host?.includes("localhost") || host?.startsWith("127.0.0.1") ? "http" : "https");
  const requestUrl = host ? normalizeUrl(`${proto}://${host}`) : null;

  // Keep preview auth flows on the current deployment host.
  if (process.env.VERCEL_ENV === "preview" && vercelUrl) {
    return normalizeUrl(`https://${vercelUrl}`);
  }

  if (configuredUrl) {
    return normalizeUrl(configuredUrl);
  }

  if (requestUrl) {
    return requestUrl;
  }

  if (req?.nextUrl?.origin) {
    return normalizeUrl(req.nextUrl.origin);
  }

  if (vercelUrl) {
    return normalizeUrl(`https://${vercelUrl}`);
  }

  console.warn("NEXTAUTH_URL fehlt; fallback auf http://localhost:3000.");
  return "http://localhost:3000";
}

function normalizeReturnTo(value: string) {
  try {
    const url = new URL(value);
    if (url.pathname !== "/" && url.pathname.endsWith("/")) {
      url.pathname = url.pathname.slice(0, -1);
    }
    return url.toString();
  } catch {
    return value;
  }
}

async function verifySteamAssertion(params: URLSearchParams, expectedReturnTo: string) {
  const opEndpoint = params.get("openid.op_endpoint");
  const ns = params.get("openid.ns");
  const claimedId = params.get("openid.claimed_id") || "";
  const identity = params.get("openid.identity") || "";
  const returnTo = params.get("openid.return_to");

  if (opEndpoint !== STEAM_OPENID_URL || ns !== "http://specs.openid.net/auth/2.0") {
    return null;
  }

  if (!returnTo || normalizeReturnTo(returnTo) !== normalizeReturnTo(expectedReturnTo)) {
    return null;
  }

  const claimedMatch = claimedId.match(STEAM_ID_PATTERN);
  const identityMatch = identity.match(STEAM_ID_PATTERN);
  if (!claimedMatch?.[1] || !identityMatch?.[1] || claimedMatch[1] !== identityMatch[1]) {
    return null;
  }

  const verifyParams = new URLSearchParams();
  for (const [key, value] of params.entries()) {
    if (key === "openid.mode") continue;
    verifyParams.set(key, value);
  }
  verifyParams.set("openid.mode", "check_authentication");

  const verifyResponse = await fetch(STEAM_OPENID_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: verifyParams.toString(),
  });

  if (!verifyResponse.ok) {
    return null;
  }

  const verifyText = await verifyResponse.text();
  if (!/is_valid\s*:\s*true/i.test(verifyText)) {
    return null;
  }

  return claimedMatch[1];
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider } = await context.params;
  if (provider !== "steam") {
    return NextResponse.json({ error: "Unsupported provider" }, { status: 404 });
  }

  const baseUrl = getAuthBaseUrl(req);
  const expectedReturnTo = `${baseUrl}/api/auth/steam-bridge/steam`;

  const steamId = await verifySteamAssertion(req.nextUrl.searchParams, expectedReturnTo);
  if (!steamId) {
    return NextResponse.redirect(`${baseUrl}/api/auth/error?error=AccessDenied`);
  }

  const code = await createSignedSteamBridgeCode(steamId);
  return NextResponse.redirect(`${baseUrl}/api/auth/callback/steam?code=${encodeURIComponent(code)}`);
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const codeRaw = form.get("code");
  const code = typeof codeRaw === "string" ? codeRaw : "";
  const steamId = await parseAndVerifySteamBridgeCode(code);
  if (!steamId) {
    return NextResponse.json({ error: "invalid_grant" }, { status: 400 });
  }

  const nonce = crypto.randomUUID().replace(/-/g, "");
  return NextResponse.json({
    access_token: `steam:${steamId}:${nonce}`,
    token_type: "Bearer",
    expires_in: 3600,
    steamId,
  });
}
