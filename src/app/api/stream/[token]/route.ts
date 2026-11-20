import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function allowedHost(hostname: string): boolean {
  const hosts = (process.env.OMNIFY_ALLOWED_STREAM_HOSTS || "")
    .split(",").map((host) => host.trim().toLowerCase()).filter(Boolean);
  const normalized = hostname.toLowerCase();
  return hosts.some((host) => normalized === host || normalized.endsWith(`.${host}`));
}

async function relay(request: NextRequest, token: string, headOnly = false) {
  if (process.env.STREAMING_RIGHTS_CONFIRMED !== "true") {
    return NextResponse.json({ error: "Streaming belum diaktifkan oleh pengelola." }, { status: 403 });
  }

  // Accept only the opaque token format returned by OmnifyAnime; never accept an arbitrary URL.
  if (!/^[A-Za-z0-9_-]{20,2048}$/.test(token)) {
    return NextResponse.json({ error: "Token stream tidak valid." }, { status: 400 });
  }

  const base = (process.env.OMNIFY_API_BASE || "https://anime.omnifylabs.sbs").replace(/\/$/, "");
  let upstreamUrl: URL;
  try { upstreamUrl = new URL(`${base}/proxy/stream/${token}`); }
  catch { return NextResponse.json({ error: "OMNIFY_API_BASE tidak valid." }, { status: 500 }); }

  if (upstreamUrl.protocol !== "https:" || !allowedHost(upstreamUrl.hostname)) {
    return NextResponse.json({ error: "Hostname stream tidak diizinkan." }, { status: 403 });
  }

  const headers = new Headers({ Accept: request.headers.get("accept") || "video/mp4, application/octet-stream, */*" });
  const range = request.headers.get("range");
  const ifRange = request.headers.get("if-range");
  if (range) headers.set("Range", range);
  if (ifRange) headers.set("If-Range", ifRange);

  try {
    const upstream = await fetch(upstreamUrl, {
      method: headOnly ? "HEAD" : "GET",
      headers,
      cache: "no-store",
      redirect: "follow",
      signal: request.signal,
    });

    const responseHeaders = new Headers();
    for (const name of [
      "content-type", "content-length", "content-range", "accept-ranges",
      "etag", "last-modified", "content-disposition",
    ]) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    // The Omnify API declares these token URLs as MP4. Only fill a missing/generic
    // MIME value on a successful response; preserve HTML/JSON error responses.
    const contentType = responseHeaders.get("content-type")?.toLowerCase() || "";
    if (upstream.ok && (!contentType || contentType === "application/octet-stream")) {
      responseHeaders.set("content-type", "video/mp4");
    }
    responseHeaders.set("cache-control", "private, no-store, no-cache, must-revalidate");
    responseHeaders.set("x-content-type-options", "nosniff");

    return new NextResponse(headOnly ? null : upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Omnify stream relay failed:", error);
    return NextResponse.json({ error: "Tidak dapat mengambil stream dari penyedia." }, { status: 502 });
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  return relay(request, token);
}

export async function HEAD(request: NextRequest, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  return relay(request, token, true);
}
