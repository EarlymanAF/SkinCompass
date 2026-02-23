const CODE_MAX_AGE_MS = 10 * 60 * 1000;

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

export function getAuthSecret() {
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

export async function createSignedSteamBridgeCode(steamId: string) {
  const timestamp = Date.now().toString();
  const payload = `${steamId}.${timestamp}`;
  const secret = getAuthSecret();
  const signature = await hmacSha256(secret, payload);
  return `v1.${steamId}.${timestamp}.${signature}`;
}

export async function parseAndVerifySteamBridgeCode(code: string) {
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
