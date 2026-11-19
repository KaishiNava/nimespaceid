import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OWNER = process.env.GITHUB_ASSETS_OWNER || "KaishiNava";
const REPO = process.env.GITHUB_ASSETS_REPO || "nime-space-assets";
const BRANCH = process.env.GITHUB_ASSETS_BRANCH || "main";
const TOKEN = process.env.GITHUB_TOKEN;
const MAX_BYTES = 10 * 1024 * 1024;

function safeSegment(value: string) {
  return value.toLowerCase().normalize("NFKD")
    .replace(/[^a-z0-9-_]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 55) || "asset";
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  let stagingPath = "";
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Sesi login tidak valid. Silakan login ulang." }, { status: 401 });

    const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profileError || !profile || !["admin", "owner"].includes(profile.role)) {
      return NextResponse.json({ error: "Akses khusus admin/owner." }, { status: 403 });
    }
    if (!TOKEN) return NextResponse.json({ error: "Environment variable GITHUB_TOKEN belum dipasang di Vercel." }, { status: 503 });

    const body = await request.json().catch(() => null);
    stagingPath = String(body?.stagingPath || "");
    const kind = String(body?.kind || "");
    const requestedName = String(body?.name || "asset");
    const contentType = String(body?.contentType || "");
    const allowed = new Map([["image/png", "png"], ["image/jpeg", "jpg"], ["image/webp", "webp"], ["image/gif", "gif"]]);
    const ext = allowed.get(contentType);
    if (!stagingPath || !stagingPath.startsWith(`${user.id}/github-staging/`) || stagingPath.includes("..") || !["banner", "border"].includes(kind) || !ext) {
      return NextResponse.json({ error: "Metadata upload tidak valid. Pilih ulang file dan coba lagi." }, { status: 400 });
    }

    const publicUrl = supabase.storage.from("profile-assets").getPublicUrl(stagingPath).data.publicUrl;
    const staged = await fetch(publicUrl, { cache: "no-store" });
    if (!staged.ok) return NextResponse.json({ error: `File staging tidak bisa dibaca dari Supabase Storage (HTTP ${staged.status}).` }, { status: 502 });
    const bytes = Buffer.from(await staged.arrayBuffer());
    if (!bytes.length) return NextResponse.json({ error: "File kosong, pilih gambar lain." }, { status: 400 });
    if (bytes.length > MAX_BYTES) return NextResponse.json({ error: "Ukuran maksimal asset 10 MB." }, { status: 413 });

    const safeName = safeSegment(requestedName);
    const path = `${kind}/${safeName}-${Date.now()}.${ext}`;
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
      body: JSON.stringify({ message: `Add ${kind} asset: ${safeName}`, content: bytes.toString("base64"), branch: BRANCH }),
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

    return NextResponse.json({ path, url: `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${path}`, html_url: result?.content?.html_url, sha: result?.content?.sha }, { headers: { "Cache-Control": "no-store" } });
  } catch (error: any) {
    console.error("Nime Space asset upload error", error);
    return NextResponse.json({ error: error?.message || "Terjadi kesalahan saat memproses upload." }, { status: 500 });
  } finally {
    // Best-effort cleanup; storage policy restricts deletion to the authenticated user's folder.
    if (stagingPath) await supabase.storage.from("profile-assets").remove([stagingPath]).catch(() => {});
  }
}
