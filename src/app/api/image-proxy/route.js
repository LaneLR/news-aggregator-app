import { NextResponse } from "next/server";
import dns from "node:dns/promises";
import net from "node:net";

// Blocks SSRF: refuses to proxy requests to loopback/private/link-local
// addresses, whether given directly as the hostname or reached via DNS.
function isBlockedIp(ip) {
  const type = net.isIP(ip);
  if (type === 4) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 127) return true; // loopback
    if (a === 10) return true; // private
    if (a === 172 && b >= 16 && b <= 31) return true; // private
    if (a === 192 && b === 168) return true; // private
    if (a === 169 && b === 254) return true; // link-local / cloud metadata
    if (a === 0) return true;
    return false;
  }
  if (type === 6) {
    const lower = ip.toLowerCase();
    if (lower === "::1") return true; // loopback
    if (lower.startsWith("fe80:")) return true; // link-local
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique local
    return false;
  }
  return true; // couldn't determine — fail closed
}

// Falls back on when an upstream serves images as a generic binary type
// instead of a proper image/* one — CNN's cdn.cnn.com (S3-backed) does this,
// returning "application/octet-stream" for genuine JPEGs, which the strict
// content-type check below would otherwise reject as "not an image".
const EXTENSION_MIME_TYPES = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  svg: "image/svg+xml",
  bmp: "image/bmp",
};

function guessMimeFromUrl(urlString) {
  const pathname = new URL(urlString).pathname;
  const ext = pathname.split(".").pop()?.toLowerCase();
  return EXTENSION_MIME_TYPES[ext] || null;
}

async function assertSafeUrl(urlString) {
  let parsed;
  try {
    parsed = new URL(urlString);
  } catch {
    throw new Error("Invalid URL");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Unsupported protocol");
  }

  const hostname = parsed.hostname;
  if (hostname === "localhost") throw new Error("Blocked host");

  if (net.isIP(hostname)) {
    if (isBlockedIp(hostname)) throw new Error("Blocked host");
    return;
  }

  const records = await dns.lookup(hostname, { all: true, verbatim: true });
  if (records.length === 0 || records.some((r) => isBlockedIp(r.address))) {
    throw new Error("Blocked host");
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get("url");
  const referrer = searchParams.get("referer");

  if (!imageUrl) {
    return NextResponse.json({ error: "No URL provided" }, { status: 400 });
  }

  try {
    await assertSafeUrl(imageUrl);
  } catch (err) {
    return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // Set timeout to 8 seconds

  try {
    const fetchHeaders = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
    };

    if (referrer) {
      fetchHeaders.Referer = referrer;
    }

    const response = await fetch(imageUrl, {
      headers: fetchHeaders,
      signal: controller.signal, // Connect the AbortController signal
      redirect: "error", // Don't follow redirects — prevents redirect-based SSRF bypass
    });

    clearTimeout(timeoutId); // Clear the timeout if the fetch succeeds

    if (!response.ok) {
      console.warn(`Failed to fetch image from ${imageUrl}: ${response.status} ${response.statusText}`);
      return NextResponse.json({ error: "Image fetch failed" }, { status: response.status });
    }

    let contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      const guessedType = guessMimeFromUrl(imageUrl);
      if (!guessedType) {
        return NextResponse.json({ error: "URL did not return an image" }, { status: 415 });
      }
      contentType = guessedType;
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // A published article's image is effectively immutable — cache it
        // for a week, and let a stale copy keep serving for a day after
        // that while it revalidates in the background. Next.js's own
        // image optimizer also uses this header to set its own cache
        // lifetime for the resized/converted output it derives from this.
        "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      console.error(`Image fetch for ${imageUrl} timed out.`);
      return NextResponse.json({ error: "Image fetch timed out" }, { status: 504 });
    }
    console.error("Image proxy error:", err.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
