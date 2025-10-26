import fs from "fs";
import path from "path";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const weapon = searchParams.get("weapon");

    // Load skins.json dynamically from data
    const filePath = path.join(process.cwd(), "data", "skins.json");
    if (!fs.existsSync(filePath)) {
      console.warn("⚠️  skins.json not found at:", filePath);
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

    let skinsRaw;
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      skinsRaw = JSON.parse(raw);
    } catch (e) {
      console.warn("⚠️ Error reading or parsing local skins.json:", e);
      // Fallback to empty array
      return Response.json([], {
        headers: {
          "Cache-Control": "public, max-age=86400, immutable",
        },
      });
    }

    // Normalize skins into flat array
    let skins: any[] = [];
    if (Array.isArray(skinsRaw)) {
      skins = skinsRaw;
    } else if (skinsRaw && typeof skinsRaw === "object") {
      // If skinsRaw has 'byWeapon' or other keys, merge all arrays into one
      if (skinsRaw.byWeapon && typeof skinsRaw.byWeapon === "object") {
        skins = Object.values(skinsRaw.byWeapon).flat();
      } else {
        // If not structured byWeapon, try to flatten all arrays in object values
        skins = Object.values(skinsRaw)
          .filter((v) => Array.isArray(v))
          .flat();
      }
    } else {
      console.warn("⚠️ Unexpected format of skins.json, returning empty array");
      return Response.json([], {
        headers: {
          "Cache-Control": "public, max-age=86400, immutable",
        },
      });
    }

    if (!weapon) {
      console.log(`✅ Loaded skins.json with total ${skins.length} skins`);
      return Response.json(skins, {
        headers: {
          "Cache-Control": "public, max-age=86400, immutable",
        },
      });
    }

    const weaponLower = weapon.toLowerCase();
    const filtered = skins.filter((s: any) => {
      if (!s.weapon) return false;
      const w = s.weapon.toString().toLowerCase();
      return w === weaponLower || w.includes(weaponLower);
    });

    console.log(`✅ Found ${filtered.length} skins matching weapon "${weapon}"`);

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
