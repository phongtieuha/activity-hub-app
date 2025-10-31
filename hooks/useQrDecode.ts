// Helper to decode QR content from a base64 PNG/JPEG data URL
// Uses pure-JS decoding via jsQR + UPNG for PNGs (Expo-compatible)

import jsQR from "jsqr";

export async function decodeQrFromBase64(
  dataUrl: string
): Promise<string | null> {
  // Pure-JS fallback using jsQR. Works in Expo Go and dev builds.
  try {
    // Lazy import to avoid bundling on web if not used
    const base64js = await import("base64-js");
    const UPNG = await import("upng-js");

    const base64 = dataUrl.replace(/^data:image\/(png|jpeg);base64,/, "");
    const bytes = base64js.toByteArray(base64);

    // Decode PNG to RGBA; if JPEG, this fallback won't work
    // Note: UPNG only supports PNGs; ensure your API returns PNG.
    const png = (UPNG as any).default ? (UPNG as any).default : (UPNG as any);
    const img = png.decode(bytes.buffer);
    const width: number = img.width;
    const height: number = img.height;
    const rgbaFrames: Uint8Array[] = png.toRGBA8(img);
    const rgba: Uint8Array = rgbaFrames[0];

    // Try both buffer and direct array for jsQR
    let clamped: Uint8ClampedArray;
    try {
      clamped = new Uint8ClampedArray(rgba);
    } catch {
      clamped = new Uint8ClampedArray(rgba.buffer);
    }
    const result = jsQR(clamped, width, height, {
      inversionAttempts: "attemptBoth",
    });
    return result?.data ?? null;
  } catch (error) {
    console.warn("QR decode failed:", error);
    return null;
  }
}
