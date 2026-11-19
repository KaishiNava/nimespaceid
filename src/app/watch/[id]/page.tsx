import Link from "next/link";
import Navbar from "@/components/Navbar";
import StreamPlayer from "@/components/StreamPlayer";
import { animeRequest, asRecord, unwrapData } from "@/lib/anime";

type StreamSource = { url: string; label: string; type: "video" | "hls" | "embed" };
const URL_KEYS = ["url", "file", "src", "stream_url", "streamUrl", "video_url", "videoUrl", "embed_url", "embedUrl", "embed", "link"];
const SKIP_KEYS = new Set(["poster", "thumbnail", "image", "cover", "banner", "logo", "avatar"]);

function collectStreams(value: unknown, result: StreamSource[] = [], depth = 0): StreamSource[] {
  if (depth > 8 || value == null || result.length >= 12) return result;
  if (Array.isArray(value)) {
    for (const item of value) collectStreams(item, result, depth + 1);
    return result;
  }
  const record = asRecord(value);
  if (!record) return result;
  const label = String(record.quality || record.label || record.server || record.name || record.resolution || `Sumber ${result.length + 1}`);
  for (const key of URL_KEYS) {
    const candidate = record[key];
    if (typeof candidate !== "string") continue;
    try {
      const parsed = new URL(candidate);
      if (parsed.protocol !== "https:") continue;
      const isEmbed = /embed/i.test(key) || /embed/i.test(label);
      const isHls = /\.m3u8(?:$|[?#])/i.test(parsed.href) || String(record.type || record.format || "").toLowerCase().includes("hls");
      if (!result.some((item) => item.url === parsed.href)) result.push({ url: parsed.href, label, type: isEmbed ? "embed" : isHls ? "hls" : "video" });
    } catch { /* Ignore malformed URLs. */ }
  }
  for (const [key, child] of Object.entries(record)) if (!SKIP_KEYS.has(key.toLowerCase())) collectStreams(child, result, depth + 1);
  return result;
}

function isAllowed(url: string): boolean {
  // Intentionally fail closed: only domains explicitly approved by the content owner can play.
  if (process.env.STREAMING_RIGHTS_CONFIRMED !== "true") return false;
  const hosts = (process.env.OMNIFY_ALLOWED_STREAM_HOSTS || "").split(",").map((host) => host.trim().toLowerCase()).filter(Boolean);
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hosts.some((host) => hostname === host || hostname.endsWith(`.${host}`));
  } catch { return false; }
}

export const dynamic = "force-dynamic";

export default async function WatchPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ episode?: string; episodeId?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const episode = query.episode || "1";
  const episodeId = query.episodeId || `${id}-ep-${episode}`;
  let payload: unknown = null;
  let error = "";
  try { payload = await animeRequest(`/anime/episode?id=${encodeURIComponent(episodeId)}`); }
  catch (e) { error = e instanceof Error ? e.message : "Episode tidak tersedia."; }

  const allSources = collectStreams(unwrapData(payload));
  const sources = allSources.filter((source) => isAllowed(source.url));
  const blockedCount = allSources.length - sources.length;
  return <><Navbar /><main className="container py-8 md:py-12">
    <Link href={`/anime/${encodeURIComponent(id)}`} className="text-sm muted hover:text-white">← Kembali ke detail anime</Link>
    <p className="eyebrow mt-7">NIME SPACE PLAYER</p>
    <h1 className="mt-2 font-display text-3xl font-bold">Episode {episode}</h1>
    {sources.length > 0 ? <StreamPlayer sources={sources} title={`NIME SPACE — Episode ${episode}`} /> : <div className="mt-6 rounded-2xl border border-line bg-panel p-6 md:p-10"><div className="mx-auto max-w-xl text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-line bg-black text-2xl">▶</div><h2 className="mt-5 text-xl font-bold">Sumber video belum bisa diputar</h2><p className="mt-3 text-sm leading-7 text-gray-400">{error ? `Data episode gagal dimuat: ${error}` : blockedCount > 0 ? "Sumber ditemukan, tetapi domain atau izin distribusinya belum disetujui oleh pengelola." : "API belum mengirim URL video atau embed yang dikenali untuk episode ini."}</p><p className="mt-4 text-xs leading-6 text-gray-500">Pemutar hanya menerima HTTPS dari domain yang pengelola telah verifikasi hak distribusinya. Pastikan API key, endpoint episode, dan konfigurasi domain benar.</p></div></div>}
    <div className="mt-5 rounded-xl border border-line p-4 text-xs leading-6 text-gray-500">Jika video gagal diputar, penyebab umum adalah URL kedaluwarsa, format tidak didukung, pembatasan CORS pada HLS, atau sumber tidak mengizinkan pemutaran di situs lain.</div>
    <details className="mt-5"><summary className="cursor-pointer text-sm text-gray-400">Diagnostik respons API</summary><pre className="mt-3 max-h-80 overflow-auto rounded-xl bg-black p-4 text-xs text-gray-400">{JSON.stringify({ error: error || undefined, detectedSources: allSources.map(({ url, label, type }) => ({ url, label, type })), playableSources: sources.length }, null, 2)}</pre></details>
  </main></>;
}
