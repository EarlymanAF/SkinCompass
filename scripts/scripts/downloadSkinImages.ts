import fs from "fs";
import path from "path";
import { getImageCacheKey } from "@/lib/skin-utils";

type SkinEntry = {
  name?: string;
  image?: string | null;
  weapon?: string;
};

const OUTPUT_DIR = path.join(process.cwd(), "public", "skin-images");
const SKINS_PATH = path.join(process.cwd(), "data", "skins.json");
const SUPPORTED_CONTENT_TYPES: Record<string, string> = {
  "image/webp": ".webp",
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/avif": ".avif",
};

function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

function readSkins(): SkinEntry[] {
  if (!fs.existsSync(SKINS_PATH)) {
    throw new Error(`skins.json not found at ${SKINS_PATH}`);
  }

  const raw = fs.readFileSync(SKINS_PATH, "utf-8");
  const parsed = JSON.parse(raw);

  if (Array.isArray(parsed)) {
    return parsed;
  }
  if (parsed && typeof parsed === "object") {
    if (Array.isArray(parsed.skins)) {
      return parsed.skins;
    }
    if (parsed.byWeapon && typeof parsed.byWeapon === "object") {
      return Object.values(parsed.byWeapon)
        .filter((v): v is SkinEntry[] => Array.isArray(v))
        .flat();
    }
    return Object.values(parsed)
      .filter((v): v is SkinEntry[] => Array.isArray(v))
      .flat();
  }

  return [];
}

function getFileExtension(contentType: string | null): string {
  if (!contentType) return ".webp";
  const normalized = contentType.toLowerCase().split(";")[0]?.trim() ?? "";
  return SUPPORTED_CONTENT_TYPES[normalized] ?? ".webp";
}

async function downloadImage(url: string, key: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url} (${response.status})`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const extension = getFileExtension(response.headers.get("content-type"));
  const filePath = path.join(OUTPUT_DIR, `${key}${extension}`);

  fs.writeFileSync(filePath, buffer);
  return filePath;
}

async function main() {
  ensureOutputDir();
  const skins = readSkins();

  const images = new Map<string, string>();
  for (const entry of skins) {
    if (!entry?.image) continue;
    const key = getImageCacheKey(entry.image);
    if (!key) continue;
    if (!images.has(key)) {
      images.set(key, entry.image);
    }
  }

  console.log(`Found ${images.size} unique images to download.`);

  const existingFiles = fs.existsSync(OUTPUT_DIR)
    ? new Set(fs.readdirSync(OUTPUT_DIR))
    : new Set<string>();

  let downloaded = 0;
  for (const [key, url] of images) {
    let alreadyPresent = false;
    for (const file of existingFiles) {
      if (file.startsWith(`${key}.`)) {
        alreadyPresent = true;
        break;
      }
    }
    if (alreadyPresent) {
      continue;
    }

    try {
      const filePath = await downloadImage(url, key);
      downloaded += 1;
      existingFiles.add(path.basename(filePath));
      console.log(`✅ Saved ${filePath}`);
    } catch (err) {
      console.error(`❌ Failed for ${url}:`, err);
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  console.log(`Done. Downloaded ${downloaded} new images. Stored in ${OUTPUT_DIR}`);
}

main().catch((err) => {
  console.error("Fatal error during image download:", err);
  process.exit(1);
});
