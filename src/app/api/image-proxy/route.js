import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get("url");
  const referrer = searchParams.get("referer");

  if (!imageUrl) {
    return NextResponse.json({ error: "No URL provided" }, { status: 400 });
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
    });

    clearTimeout(timeoutId); // Clear the timeout if the fetch succeeds

    if (!response.ok) {
      console.warn(`Failed to fetch image from ${imageUrl}: ${response.status} ${response.statusText}`);
      return NextResponse.json({ error: "Image fetch failed" }, { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await response.arrayBuffer());

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
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
