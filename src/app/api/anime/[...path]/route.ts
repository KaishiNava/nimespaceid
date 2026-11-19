import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const key = process.env.OMNIFY_API_KEY;
  const base = (process.env.OMNIFY_API_BASE || "https://anime.omnifylabs.sbs").replace(/\/$/, "");

  if (!key) {
    return NextResponse.json({ error: "API key belum dikonfigurasi di server." }, { status: 503 });
  }
  if (!path.length || path.some((segment) => !/^[a-zA-Z0-9_-]+$/.test(segment))) {
    return NextResponse.json({ error: "Endpoint tidak valid." }, { status: 400 });
  }

  try {
    const url = new URL(`${base}/${path.map(encodeURIComponent).join("/")}`);
    request.nextUrl.searchParams.forEach((value, name) => url.searchParams.set(name, value));

    const upstream = await fetch(url, {
      headers: { "X-API-Key": key, Accept: "application/json" },
      next: { revalidate: 180 },
    });
    const body = await upstream.text();
    let payload: unknown;
    try {
      payload = body ? JSON.parse(body) : null;
    } catch {
      payload = { error: "Penyedia API mengirim respons yang tidak valid." };
    }

    return NextResponse.json(payload, { status: upstream.status });
  } catch (error) {
    console.error("Anime API proxy error:", error);
    return NextResponse.json({ error: "Tidak dapat terhubung ke penyedia anime." }, { status: 502 });
  }
}
