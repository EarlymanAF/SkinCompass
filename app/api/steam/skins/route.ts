import fs from "fs";
import path from "path";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const weapon = searchParams.get("weapon");

    // Load skins.json dynamically from data
    const filePath = path.join(process.cwd(), "data", "skins.json");
    if (!fs.existsSync(filePath)) {
      console.error("⚠️  skins.json not found at:", filePath);
      // Fallback: try fetching from deployed URL if local file not found
      const remoteUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://www.skincompass.de"}/data/skins.json`;
      console.log("🌐 Falling back to remote skins.json:", remoteUrl);
      try {
        const res = await fetch(remoteUrl);
        if (!res.ok) throw new Error(`Failed to fetch remote skins.json (${res.status})`);
        const remoteSkins = await res.json();
        return Response.json(remoteSkins, {
          headers: {
            "Cache-Control": "public, max-age=86400, immutable",
          },
        });
      } catch (e) {
        console.error("❌ Could not fetch remote skins.json:", e);
        // Always return valid JSON (empty array fallback)
        return Response.json([], {
          headers: {
            "Cache-Control": "public, max-age=86400, immutable",
          },
        });
      }
    }
    let skins;
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      skins = JSON.parse(raw);
    } catch (e) {
      console.error("❌ Error reading local skins.json:", e);
      // Fallback to empty array
      return Response.json([], {
        headers: {
          "Cache-Control": "public, max-age=86400, immutable",
        },
      });
    }

    console.log(`✅ Loaded skins.json (${Array.isArray(skins) ? skins.length : Object.keys(skins).length} entries)`);

    let filtered = skins;
    if (weapon) {
      filtered = Array.isArray(skins)
        ? skins.filter((s: any) => s.weapon === weapon)
        : (skins.byWeapon?.[weapon] ?? []);
    }

    return Response.json(filtered, {
      headers: {
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (err: any) {
    console.error("❌ Error loading skins.json:", err);
    return Response.json(
      { error: "Failed to load skins.json", details: err.message },
      { status: 500 }
    );
  }
}
