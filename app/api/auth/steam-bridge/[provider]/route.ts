import { NextRequest, NextResponse } from "next/server";

const STEAM_OPENID_URL = "https://steamcommunity.com/openid/login";
const STEAM_ID_PATTERN = /^https?:\/\/steamcommunity\.com\/openid\/id\/(\d+)$/;
const CODE_MAX_AGE_MS = 10 * 60 * 1000;

function normalizeUrl(value: string) {
  return value.replace(/\/$/, "");
}

function isVercelDeploymentHost(host: string) {
  return /^[a-z0-9][a-z0-9-]*-[a-z0-9]{9,}-[a-z0-9-]+\.vercel\.app$/i.test(host);
}

function getAuthBaseUrl(req?: NextRequest) {
  const vercelUrl = process.env.VERCEL_URL;
  const configuredUrl = process.env.NEXTAUTH_URL ?? process.env.AUTH_URL;

  const host = req?.headers.get("x-forwarded-host") ?? req?.headers.get("host");
  const proto =
    req?.headers.get("x-forwarded-proto") ??
    (host?.includes("localhost") || host?.startsWith("127.0.0.1") ? "http" : "https");
  const requestUrl = host ? normalizeUrl(`${proto}://${host}`) : null;

  if (configuredUrl) {
    const normalized = normalizeUrl(configuredUrl);

    // Keep stable preview aliases, but avoid stale one-off deployment URLs.
    if (process.env.VERCEL_ENV === "preview" && vercelUrl) {
      try {
        const configuredHost = new URL(normalized).host;
        if (isVercelDeploymentHost(configuredHost) && configuredHost !== vercelUrl) {
          return requestUrl ?? normalizeUrl(`https://${vercelUrl}`);
        }
      } catch {
        return requestUrl ?? normalizeUrl(`https://${vercelUrl}`);
      }
    }

    return normalized;
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

function getAuthSecret() {
  const configured = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
  if (configured) {
    return configured;
  }

  if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL) {
    console.warn("NEXTAUTH_SECRET fehlt in Preview; fallback secret aus VERCEL_URL wird verwendet.");
    return `preview:${process.env.VERCEL_URL}:auth-secret`;
  }

  console.warn("NEXTAUTH_SECRET fehlt; globaler fallback secret wird verwendet.");
  return "fallback:global:auth-secret";
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

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function hmacSha256(secret: string, data: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return toBase64Url(new Uint8Array(signature));
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

async function createSignedCode(steamId: string) {
  const timestamp = Date.now().toString();
  const payload = `${steamId}.${timestamp}`;
  const secret = getAuthSecret();
  const signature = await hmacSha256(secret, payload);
  return `v1.${steamId}.${timestamp}.${signature}`;
}

async function parseAndVerifyCode(code: string) {
  const parts = code.split(".");
  if (parts.length !== 4 || parts[0] !== "v1") {
    return null;
  }

  const [, steamId, timestampRaw, signature] = parts;

  if (!/^\d{17}$/.test(steamId)) {
    return null;
  }

  const timestamp = Number(timestampRaw);
  if (!Number.isFinite(timestamp)) {
    return null;
  }

  if (Math.abs(Date.now() - timestamp) > CODE_MAX_AGE_MS) {
    return null;
  }

  const secret = getAuthSecret();
  const expected = await hmacSha256(secret, `${steamId}.${timestampRaw}`);
  if (expected !== signature) {
    return null;
  }

  return steamId;
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

  const code = await createSignedCode(steamId);
  return NextResponse.redirect(`${baseUrl}/api/auth/callback/steam?code=${encodeURIComponent(code)}`);
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const codeRaw = form.get("code");
  const code = typeof codeRaw === "string" ? codeRaw : "";
  const steamId = await parseAndVerifyCode(code);
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
