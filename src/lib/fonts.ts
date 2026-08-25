import type { StoredFontAsset, StoredFontFace } from "./storage";

export interface GoogleFontChoice {
  family: string;
  category: "Sans" | "Serif" | "Display" | "Handwriting" | "Mono";
}

export const SYSTEM_FONTS = ["Helvetica", "Arial", "Georgia", "Trebuchet MS", "Courier New"];

export const GOOGLE_FONT_CHOICES: GoogleFontChoice[] = [
  { family: "DM Sans", category: "Sans" },
  { family: "Figtree", category: "Sans" },
  { family: "Montserrat", category: "Sans" },
  { family: "Nunito", category: "Sans" },
  { family: "Oswald", category: "Sans" },
  { family: "Poppins", category: "Sans" },
  { family: "Raleway", category: "Sans" },
  { family: "Rubik", category: "Sans" },
  { family: "Source Sans 3", category: "Sans" },
  { family: "Space Grotesk", category: "Sans" },
  { family: "Work Sans", category: "Sans" },
  { family: "Archivo", category: "Sans" },
  { family: "Barlow", category: "Sans" },
  { family: "Cabin", category: "Sans" },
  { family: "Exo 2", category: "Sans" },
  { family: "Inter", category: "Sans" },
  { family: "Josefin Sans", category: "Sans" },
  { family: "Karla", category: "Sans" },
  { family: "Lato", category: "Sans" },
  { family: "Manrope", category: "Sans" },
  { family: "Mulish", category: "Sans" },
  { family: "Open Sans", category: "Sans" },
  { family: "Outfit", category: "Sans" },
  { family: "PT Sans", category: "Sans" },
  { family: "Public Sans", category: "Sans" },
  { family: "Quicksand", category: "Sans" },
  { family: "Roboto", category: "Sans" },
  { family: "Sora", category: "Sans" },
  { family: "Urbanist", category: "Sans" },
  { family: "Libre Baskerville", category: "Serif" },
  { family: "Lora", category: "Serif" },
  { family: "Merriweather", category: "Serif" },
  { family: "Playfair Display", category: "Serif" },
  { family: "Alegreya", category: "Serif" },
  { family: "Bitter", category: "Serif" },
  { family: "Bodoni Moda", category: "Serif" },
  { family: "Cormorant Garamond", category: "Serif" },
  { family: "Crimson Pro", category: "Serif" },
  { family: "DM Serif Display", category: "Serif" },
  { family: "EB Garamond", category: "Serif" },
  { family: "Libre Caslon Text", category: "Serif" },
  { family: "Noto Serif", category: "Serif" },
  { family: "PT Serif", category: "Serif" },
  { family: "Roboto Slab", category: "Serif" },
  { family: "Spectral", category: "Serif" },
  { family: "Abril Fatface", category: "Display" },
  { family: "Bebas Neue", category: "Display" },
  { family: "Alfa Slab One", category: "Display" },
  { family: "Anton", category: "Display" },
  { family: "Archivo Black", category: "Display" },
  { family: "Bungee", category: "Display" },
  { family: "Cinzel", category: "Display" },
  { family: "Fjalla One", category: "Display" },
  { family: "Fraunces", category: "Display" },
  { family: "Fredoka", category: "Display" },
  { family: "Lilita One", category: "Display" },
  { family: "Lobster", category: "Display" },
  { family: "Permanent Marker", category: "Display" },
  { family: "Righteous", category: "Display" },
  { family: "Ultra", category: "Display" },
  { family: "Caveat", category: "Handwriting" },
  { family: "Dancing Script", category: "Handwriting" },
  { family: "Pacifico", category: "Handwriting" },
  { family: "Allura", category: "Handwriting" },
  { family: "Amatic SC", category: "Handwriting" },
  { family: "Architects Daughter", category: "Handwriting" },
  { family: "Cookie", category: "Handwriting" },
  { family: "Great Vibes", category: "Handwriting" },
  { family: "Kalam", category: "Handwriting" },
  { family: "Kaushan Script", category: "Handwriting" },
  { family: "Patrick Hand", category: "Handwriting" },
  { family: "Sacramento", category: "Handwriting" },
  { family: "Satisfy", category: "Handwriting" },
  { family: "IBM Plex Mono", category: "Mono" },
  { family: "Roboto Mono", category: "Mono" },
  { family: "DM Mono", category: "Mono" },
  { family: "Fira Code", category: "Mono" },
  { family: "JetBrains Mono", category: "Mono" },
  { family: "Space Mono", category: "Mono" },
  { family: "Ubuntu Mono", category: "Mono" },
];

const GOOGLE_CSS_API = "https://fonts.googleapis.com/css2";

function fontId(source: StoredFontAsset["source"], family: string): string {
  return `${source}:${family.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

function cssValue(block: string, property: string): string | undefined {
  const match = block.match(new RegExp(`${property}\\s*:\\s*([^;]+);`, "i"));
  return match?.[1].trim().replace(/^['"]|['"]$/g, "");
}

function safeFamilyFromFilename(name: string): string {
  const family = name.replace(/\.(woff2?|ttf|otf)$/i, "").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  return family || "Uploaded font";
}

export function createUploadedFont(file: File): StoredFontAsset {
  const family = safeFamilyFromFilename(file.name);
  return {
    id: fontId("upload", family),
    family,
    name: file.name,
    source: "upload",
    license: "User supplied; verify redistribution rights before sharing",
    createdAt: new Date().toISOString(),
    faces: [{
      mimeType: file.type || "font/woff2",
      size: file.size,
      style: "normal",
      weight: "100 900",
      blob: file,
    }],
  };
}

export async function downloadGoogleFont(
  family: string,
  fetcher: typeof fetch = fetch,
): Promise<StoredFontAsset> {
  if (!GOOGLE_FONT_CHOICES.some((font) => font.family === family)) throw new Error("That Google font is not in the GlassWare catalog.");
  const parameters = new URLSearchParams({ family, display: "swap" });
  const cssResponse = await fetcher(`${GOOGLE_CSS_API}?${parameters}`);
  if (!cssResponse.ok) throw new Error("Google Fonts is unavailable right now.");
  const css = await cssResponse.text();
  const blocks = [...css.matchAll(/@font-face\s*{([^}]+)}/gi)].map((match) => match[1]);
  const faces: StoredFontFace[] = [];
  for (const block of blocks) {
    const url = block.match(/url\((['"]?)(https:\/\/fonts\.gstatic\.com\/[^)'"\s]+)\1\)/i)?.[2];
    if (!url) continue;
    const response = await fetcher(url);
    if (!response.ok) throw new Error(`The ${family} font file could not be downloaded.`);
    const blob = await response.blob();
    faces.push({
      mimeType: blob.type || "font/woff2",
      size: blob.size,
      style: cssValue(block, "font-style") ?? "normal",
      weight: cssValue(block, "font-weight") ?? "400",
      unicodeRange: cssValue(block, "unicode-range"),
      blob,
    });
  }
  if (!faces.length) throw new Error(`Google Fonts did not return a usable ${family} file.`);
  return {
    id: fontId("google", family),
    family,
    name: family,
    source: "google",
    sourceUrl: `https://fonts.google.com/specimen/${encodeURIComponent(family).replace(/%20/g, "+")}`,
    license: "Open source via Google Fonts",
    createdAt: new Date().toISOString(),
    faces,
  };
}

export async function registerFont(font: StoredFontAsset): Promise<void> {
  if (typeof FontFace === "undefined" || typeof document === "undefined") return;
  await Promise.all(font.faces.map(async (face) => {
    const source = await face.blob.arrayBuffer();
    const loaded = await new FontFace(font.family, source, {
      style: face.style,
      weight: face.weight,
      unicodeRange: face.unicodeRange,
      display: "swap",
    }).load();
    document.fonts.add(loaded);
  }));
}
