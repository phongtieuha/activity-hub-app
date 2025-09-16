// Helper to decode QR content from a base64 PNG/JPEG data URL
// Tries native module 'react-native-qr-decode-image-camera' if available,
// falls back to pure-JS decoding via jsQR + UPNG for PNGs.

import jsQR from "jsqr";

export async function decodeQrFromBase64(
  dataUrl: string
): Promise<string | null> {
  // Try native decoder first (requires dev build)
  try {
    const rnqr = await import("react-native-qr-decode-image-camera");
    const QRCode =
      (rnqr as any)?.default || (rnqr as any)?.QRCode || (rnqr as any);
    if (QRCode && typeof QRCode.decode === "function") {
      return await new Promise<string | null>((resolve) => {
        try {
          QRCode.decode(dataUrl, (error: any, result: string | null) => {
            if (error) return resolve(null);
            resolve(result ?? null);
          });
        } catch {
          resolve(null);
        }
      });
    }
  } catch {
    // native lib not available; continue to JS fallback
  }

  // FORCE: Always run JS fallback for troubleshooting
  // Comment out the return above to always run JS fallback

  // Pure-JS fallback using jsQR. Works in Expo Go.
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
  } catch {
    return null;
  }
}
