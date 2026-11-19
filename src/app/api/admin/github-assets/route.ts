import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const OWNER = process.env.GITHUB_ASSETS_OWNER || "KaishiNava";
const REPO = process.env.GITHUB_ASSETS_REPO || "nime-space-assets";
const BRANCH = process.env.GITHUB_ASSETS_BRANCH || "main";
const TOKEN = process.env.GITHUB_TOKEN;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "owner"].includes(profile.role)) {
    return NextResponse.json({ error: "Akses khusus admin/owner." }, { status: 403 });
  }
  if (!TOKEN) return NextResponse.json({ error: "GITHUB_TOKEN belum diatur di Environment Variables Vercel." }, { status: 503 });

  const form = await request.formData();
  const file = form.get("file");
  const kind = form.get("kind");
  const requestedName = String(form.get("name") || "asset");
  if (!(file instanceof File) || (kind !== "banner" && kind !== "border")) {
    return NextResponse.json({ error: "File atau jenis asset tidak valid." }, { status: 400 });
  }
  const allowed = new Map([["image/png", "png"], ["image/jpeg", "jpg"], ["image/webp", "webp"], ["image/gif", "gif"]]);
  const ext = allowed.get(file.type);
  if (!ext) return NextResponse.json({ error: "Format hanya PNG, JPG, WEBP, atau GIF." }, { status: 415 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "Ukuran maksimal 10 MB." }, { status: 413 });

  const safeName = requestedName.toLowerCase().normalize("NFKD").replace(/[^a-z0-9-_]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 55) || "asset";
  const path = `${kind}/${safeName}-${Date.now()}.${ext}`;
  const content = Buffer.from(await file.arrayBuffer()).toString("base64");
  const endpoint = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`;
  const upstream = await fetch(endpoint, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message: `Add ${kind} asset: ${safeName}`, content, branch: BRANCH }),
    cache: "no-store",
  });
  const result = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    console.error("GitHub asset upload failed", upstream.status, result?.message);
    return NextResponse.json({ error: result?.message || "GitHub menolak upload. Periksa token dan izin Contents: Read and write." }, { status: upstream.status });
  }
  return NextResponse.json({
    path,
    url: `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${path}`,
    html_url: result?.content?.html_url,
  });
}
