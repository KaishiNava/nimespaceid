import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OWNER = process.env.GITHUB_ASSETS_OWNER || "KaishiNava";
const REPO = process.env.GITHUB_ASSETS_REPO || "nime-space-assets";
const BRANCH = process.env.GITHUB_ASSETS_BRANCH || "main";
const TOKEN = process.env.GITHUB_TOKEN;

function safeSegment(value: string) {
  return value.toLowerCase().normalize("NFKD")
    .replace(/[^a-z0-9-_]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 55) || "asset";
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Sesi login tidak valid. Silakan login ulang." }, { status: 401 });

    const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profileError || !profile || !["admin", "owner"].includes(profile.role)) {
      return NextResponse.json({ error: "Akses khusus admin/owner." }, { status: 403 });
    }
    if (!TOKEN) return NextResponse.json({ error: "Environment variable GITHUB_TOKEN belum dipasang di Vercel." }, { status: 503 });

    const form = await request.formData();
    const file = form.get("file");
    const kind = String(form.get("kind") || "");
    const requestedName = String(form.get("name") || "asset");
    if (!(file instanceof File) || !["banner", "border"].includes(kind)) {
      return NextResponse.json({ error: "File atau jenis asset tidak valid." }, { status: 400 });
    }

    const allowed = new Map([["image/png", "png"], ["image/jpeg", "jpg"], ["image/webp", "webp"], ["image/gif", "gif"]]);
    const ext = allowed.get(file.type);
    if (!ext) return NextResponse.json({ error: "Format hanya PNG, JPG, WEBP, atau GIF." }, { status: 415 });
    if (file.size === 0) return NextResponse.json({ error: "File kosong, pilih gambar lain." }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "Ukuran maksimal 10 MB." }, { status: 413 });

    const safeName = safeSegment(requestedName);
    const path = `${kind}/${safeName}-${Date.now()}.${ext}`;
    const content = Buffer.from(await file.arrayBuffer()).toString("base64");
    const endpoint = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path.split("/").map(encodeURIComponent).join("/")}`;
    const upstream = await fetch(endpoint, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
        "User-Agent": "Nime-Space-Profile-Studio",
      },
      body: JSON.stringify({ message: `Add ${kind} asset: ${safeName}`, content, branch: BRANCH }),
      cache: "no-store",
    });
    const result: any = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      console.error("GitHub asset upload failed", upstream.status, result?.message);
      let hint = "";
      if (upstream.status === 401) hint = " Token GitHub tidak valid/kedaluwarsa.";
      else if (upstream.status === 403) hint = " Token tidak memiliki izin Contents: Read and write, atau terkena rate limit.";
      else if (upstream.status === 404) hint = " Repository atau branch tidak ditemukan, periksa GITHUB_ASSETS_OWNER, GITHUB_ASSETS_REPO, dan GITHUB_ASSETS_BRANCH.";
      else if (upstream.status === 409) hint = " Branch/repository sedang konflik, coba beberapa saat lagi.";
      return NextResponse.json({ error: `GitHub menolak upload (HTTP ${upstream.status}): ${result?.message || "Unknown error"}.${hint}` }, { status: upstream.status });
    }

    return NextResponse.json({
      path,
      url: `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${path}`,
      html_url: result?.content?.html_url,
      sha: result?.content?.sha,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error: any) {
    console.error("Nime Space asset upload error", error);
    return NextResponse.json({ error: error?.message || "Terjadi kesalahan saat memproses upload." }, { status: 500 });
  }
}
