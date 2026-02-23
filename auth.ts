import NextAuth, { customFetch } from "next-auth";
import { getAuthSecret, parseAndVerifySteamBridgeCode } from "@/lib/steam-bridge-code";

const STEAM_OPENID_URL = "https://steamcommunity.com/openid/login";

function getSteamApiKey() {
  return process.env.STEAM_API_KEY ?? null;
}

function normalizeUrl(value: string) {
  return value.replace(/\/$/, "");
}

function parseVercelDeploymentHost(host: string) {
  const match = host.match(/^(.*)-([a-z0-9]{9,})-([a-z0-9-]+\.vercel\.app)$/i);
  if (!match) {
    return null;
  }

  return {
    prefix: match[1],
    deploymentId: match[2],
    suffix: match[3],
  };
}

function isStalePreviewDeploymentUrl(configuredHost: string, vercelUrl: string) {
  const configured = parseVercelDeploymentHost(configuredHost);
  const current = parseVercelDeploymentHost(vercelUrl);

  if (!configured || !current) {
    return false;
  }

  return (
    configured.prefix === current.prefix &&
    configured.suffix === current.suffix &&
    configured.deploymentId !== current.deploymentId
  );
}

function getPreviewBranchBaseUrl() {
  const branchUrl = process.env.VERCEL_BRANCH_URL;
  if (!branchUrl) return null;
  const normalized = branchUrl.startsWith("http://") || branchUrl.startsWith("https://")
    ? branchUrl
    : `https://${branchUrl}`;
  return normalizeUrl(normalized);
}

function getAuthBaseUrl() {
  const vercelUrl = process.env.VERCEL_URL;
  const configuredUrl = process.env.NEXTAUTH_URL ?? process.env.AUTH_URL;

  if (process.env.VERCEL_ENV === "preview") {
    const branchBaseUrl = getPreviewBranchBaseUrl();
    if (branchBaseUrl) {
      return branchBaseUrl;
    }

    if (configuredUrl) {
      const normalized = normalizeUrl(configuredUrl);
      if (vercelUrl) {
        try {
          const configuredHost = new URL(normalized).host;
          if (isStalePreviewDeploymentUrl(configuredHost, vercelUrl)) {
            console.warn(
              "NEXTAUTH_URL zeigt auf ein anderes Preview-Deployment; verwende aktuelle VERCEL_URL.",
            );
            return normalizeUrl(`https://${vercelUrl}`);
          }
        } catch {
          console.warn("NEXTAUTH_URL ist ungueltig; fallback auf aktuelle VERCEL_URL.");
          return normalizeUrl(`https://${vercelUrl}`);
        }
      }

      return normalized;
    }

    if (vercelUrl) {
      return normalizeUrl(`https://${vercelUrl}`);
    }
  }

  if (configuredUrl) {
    return normalizeUrl(configuredUrl);
  }

  if (vercelUrl) {
    return normalizeUrl(`https://${vercelUrl}`);
  }

  console.warn("NEXTAUTH_URL fehlt; fallback auf http://localhost:3000.");
  return "http://localhost:3000";
}

function buildFallbackSteamProfile(steamId: string) {
  return {
    steamid: steamId,
    personaname: `Steam #${steamId.slice(-6)}`,
    avatarfull: null,
  };
}

function extractCodeFromBody(body: RequestInit["body"] | null | undefined) {
  if (!body) return "";

  if (body instanceof URLSearchParams) {
    return body.get("code") ?? "";
  }

  if (body instanceof FormData) {
    const value = body.get("code");
    return typeof value === "string" ? value : "";
  }

  if (typeof body === "string") {
    return new URLSearchParams(body).get("code") ?? "";
  }

  if (body instanceof Uint8Array) {
    return new URLSearchParams(new TextDecoder().decode(body)).get("code") ?? "";
  }

  return "";
}

function normalizeComparableUrl(value: string) {
  const url = new URL(value);
  url.search = "";
  url.hash = "";
  if (url.pathname !== "/" && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.slice(0, -1);
  }
  return url.toString();
}

function getFetchUrl(input: RequestInfo | URL) {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function createSteamBridgeTokenFetch(tokenEndpoint: string): typeof fetch {
  const normalizedTokenEndpoint = normalizeComparableUrl(tokenEndpoint);

  return async (input, init) => {
    const requestedUrl = normalizeComparableUrl(getFetchUrl(input));
    const method = (init?.method ?? "GET").toUpperCase();

    if (requestedUrl === normalizedTokenEndpoint && method === "POST") {
      const code = extractCodeFromBody(init?.body);
      const steamId = await parseAndVerifySteamBridgeCode(code);
      if (!steamId) {
        return Response.json({ error: "invalid_grant" }, { status: 400 });
      }

      const nonce = crypto.randomUUID().replace(/-/g, "");
      return Response.json({
        access_token: `steam:${steamId}:${nonce}`,
        token_type: "Bearer",
        expires_in: 3600,
        steamId,
      });
    }

    return fetch(input, init);
  };
}

function getSupabaseServiceConfig() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    return null;
  }

  return { url, key };
}

async function upsertUserProfile(user: {
  id?: string | null;
  name?: string | null;
  image?: string | null;
}) {
  const steamId = user.id;
  if (!steamId || !/^\d{17}$/.test(steamId)) {
    return;
  }

  const config = getSupabaseServiceConfig();
  if (!config) {
    console.warn("Supabase service env vars fehlen; steam_profiles upsert wurde übersprungen.");
    return;
  }

  const response = await fetch(
    `${config.url.replace(/\/$/, "")}/rest/v1/steam_profiles?on_conflict=steam_id`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        steam_id: steamId,
        display_name: user.name ?? null,
        avatar_url: user.image ?? null,
        last_login_at: new Date().toISOString(),
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    console.error("steam_profiles upsert fehlgeschlagen", response.status, body);
  }
}

function extractSteamIdFromTokens(tokens: Record<string, unknown>) {
  const direct = tokens.steamId;
  if (typeof direct === "string" && /^\d{17}$/.test(direct)) {
    return direct;
  }

  const accessToken = tokens.access_token;
  if (typeof accessToken === "string") {
    const parts = accessToken.split(":");
    if (parts.length >= 3 && parts[0] === "steam" && /^\d{17}$/.test(parts[1])) {
      return parts[1];
    }
  }

  return null;
}

function normalizeSteamId(value: unknown) {
  if (typeof value === "string" && /^\d{17}$/.test(value)) {
    return value;
  }
  return null;
}

export const { handlers, auth, signIn, signOut } = NextAuth(
  {
    trustHost: true,
    secret: getAuthSecret(),
    session: {
      strategy: "jwt",
    },
    providers: [
      () => {
        const steamApiKey = getSteamApiKey();
        const nextAuthUrl = getAuthBaseUrl();

        if (!steamApiKey) {
          console.warn("STEAM_API_KEY fehlt; Steam userinfo fallback wird verwendet.");
        }

        return {
          id: "steam",
          name: "Steam",
          type: "oauth",
          clientId: "steam",
          // Steam OpenID itself does not require a client secret, but Auth.js expects one.
          clientSecret: steamApiKey ?? "steam-openid",
          checks: ["none"],
          style: {
            logo: "https://raw.githubusercontent.com/Nekonyx/next-auth-steam/bc574bb62be70993c29f6f54c350bdf64205962a/logo/steam-icon-light.svg",
            bg: "#000",
            text: "#fff",
          },
          authorization: {
            url: STEAM_OPENID_URL,
            params: {
              "openid.mode": "checkid_setup",
              "openid.ns": "http://specs.openid.net/auth/2.0",
              "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
              "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
              "openid.return_to": `${nextAuthUrl}/api/auth/steam-bridge/steam`,
              "openid.realm": nextAuthUrl,
            },
          },
          token: {
            url: `${nextAuthUrl}/api/auth/steam-bridge/steam`,
          },
          userinfo: {
            url: `${nextAuthUrl}/api/auth/steam-bridge/steam`,
            async request({ tokens }: { tokens: Record<string, unknown> }) {
              const steamId = extractSteamIdFromTokens(tokens);

              if (!steamId) {
                throw new Error("Steam-ID fehlt im Token-Response.");
              }

              if (!steamApiKey) {
                return buildFallbackSteamProfile(steamId);
              }

              try {
                const url = new URL(
                  "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/",
                );
                url.searchParams.set("key", steamApiKey);
                url.searchParams.set("steamids", steamId);

                const response = await fetch(url.toString());
                if (!response.ok) {
                  throw new Error(`Steam API error: ${response.status} ${response.statusText}`);
                }

                const data: unknown = await response.json();
                const players =
                  data &&
                  typeof data === "object" &&
                  "response" in data &&
                  (data as { response?: { players?: unknown[] } }).response?.players;

                if (players && Array.isArray(players) && players[0]) {
                  return players[0] as Record<string, unknown>;
                }
              } catch (error) {
                const message = error instanceof Error ? error.message : "unknown";
                console.warn("Steam userinfo fallback aktiv:", message);
              }

              return buildFallbackSteamProfile(steamId);
            },
          },
          profile(profile: {
            steamid?: string;
            avatarfull?: string;
            personaname?: string;
          }) {
            const steamId = profile.steamid ?? "";
            return {
              id: steamId,
              image: profile.avatarfull ?? null,
              email: `${steamId}@steamcommunity.com`,
              name: profile.personaname ?? (steamId ? `Steam #${steamId.slice(-6)}` : "Steam User"),
            };
          },
          [customFetch]: createSteamBridgeTokenFetch(`${nextAuthUrl}/api/auth/steam-bridge/steam`),
        };
      },
    ],
    callbacks: {
      async signIn({ user, account, profile }) {
        if (account?.provider !== "steam") {
          return false;
        }

        const steamId =
          normalizeSteamId(user.id) ??
          normalizeSteamId(account.providerAccountId) ??
          normalizeSteamId((profile as { steamid?: unknown } | undefined)?.steamid);

        if (!steamId) {
          console.warn("Steam signIn wurde abgelehnt: keine gueltige steamId im Callback.");
          return false;
        }

        user.id = steamId;
        return true;
      },
      async jwt({ token, user, account }) {
        const steamId =
          normalizeSteamId(user?.id) ?? normalizeSteamId(account?.providerAccountId);

        if (steamId) {
          token.steamId = steamId;
        }

        return token;
      },
      async session({ session, token }) {
        if (session.user && typeof token.steamId === "string") {
          session.user.steamId = token.steamId;
        }

        return session;
      },
    },
    events: {
      async signIn({ user, account, profile }) {
        if (account?.provider !== "steam") {
          return;
        }

        const steamId =
          normalizeSteamId(user.id) ??
          normalizeSteamId(account.providerAccountId) ??
          normalizeSteamId((profile as { steamid?: unknown } | undefined)?.steamid);

        if (steamId) {
          user.id = steamId;
        }

        await upsertUserProfile(user);
      },
    },
  },
);
