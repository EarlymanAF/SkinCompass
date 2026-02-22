import NextAuth from "next-auth";

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

function getAuthSecret() {
  const configured = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
  if (configured) {
    return configured;
  }

  // Preview safety net: keep auth functional even if env secret is missing.
  if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL) {
    console.warn("NEXTAUTH_SECRET fehlt in Preview; fallback secret aus VERCEL_URL wird verwendet.");
    return `preview:${process.env.VERCEL_URL}:auth-secret`;
  }

  console.warn("NEXTAUTH_SECRET fehlt; globaler fallback secret wird verwendet.");
  return "fallback:global:auth-secret";
}

function getAuthBaseUrl() {
  const vercelUrl = process.env.VERCEL_URL;
  const configuredUrl = process.env.NEXTAUTH_URL ?? process.env.AUTH_URL;

  if (configuredUrl) {
    const normalized = normalizeUrl(configuredUrl);

    // Keep stable preview aliases (e.g. git-dev), but ignore stale per-deploy URLs.
    if (process.env.VERCEL_ENV === "preview" && vercelUrl) {
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

  console.warn("NEXTAUTH_URL fehlt; fallback auf http://localhost:3000.");
  return "http://localhost:3000";
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
                return {
                  steamid: steamId,
                  personaname: `Steam #${steamId.slice(-6)}`,
                  avatarfull: null,
                };
              }

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

              if (!players || !Array.isArray(players) || !players[0]) {
                throw new Error("Steam profile not found");
              }

              return players[0] as Record<string, unknown>;
            },
          },
          profile(profile: {
            steamid?: string;
            avatarfull?: string;
            personaname?: string;
          }) {
            return {
              id: profile.steamid,
              image: profile.avatarfull,
              email: `${profile.steamid}@steamcommunity.com`,
              name: profile.personaname,
            };
          },
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
