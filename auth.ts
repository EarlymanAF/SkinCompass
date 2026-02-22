import NextAuth from "next-auth";

const STEAM_OPENID_URL = "https://steamcommunity.com/openid/login";

function getSteamApiKey() {
  return process.env.STEAM_API_KEY ?? null;
}

function getAuthBaseUrl() {
  const normalize = (value: string) => value.replace(/\/$/, "");
  const vercelUrl = process.env.VERCEL_URL;

  // In Vercel Preview deployments we always use the current deployment URL.
  // This avoids stale NEXTAUTH_URL values from older preview domains.
  if (process.env.VERCEL_ENV === "preview" && vercelUrl) {
    return normalize(`https://${vercelUrl}`);
  }

  const configuredUrl = process.env.NEXTAUTH_URL ?? process.env.AUTH_URL;
  if (configuredUrl) {
    return normalize(configuredUrl);
  }

  if (vercelUrl) {
    return normalize(`https://${vercelUrl}`);
  }

  throw new Error("NEXTAUTH_URL fehlt.");
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

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
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

            const url = new URL("https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/");
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
});
