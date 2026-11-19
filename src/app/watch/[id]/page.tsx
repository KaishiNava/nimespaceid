import Link from "next/link";
import Navbar from "@/components/Navbar";
import { animeRequest, asRecord, unwrapData } from "@/lib/anime";

function findStream(value: unknown, depth = 0): { url: string; kind: "video" | "embed" } | null {
  if (depth > 5 || value == null) return null;
  if (Array.isArray(value)) {
    for (const item of value) { const found = findStream(item, depth + 1); if (found) return found; }
    return null;
  }
  const record = asRecord(value);
  if (!record) return null;
  for (const key of ["url", "file", "src", "stream_url", "embed_url", "embed", "link"]) {
    const candidate = record[key];
    if (typeof candidate === "string" && /^https:\/\//i.test(candidate)) {
      return { url: candidate, kind: /embed/i.test(key) || /embed/i.test(candidate) ? "embed" : "video" };
    }
  }
  for (const [key, child] of Object.entries(record)) {
    if (["poster", "thumbnail", "image", "cover"].includes(key.toLowerCase())) continue;
    const found = findStream(child, depth + 1); if (found) return found;
  }
  return null;
}

function isAllowed(url: string): boolean {
  if (process.env.STREAMING_RIGHTS_CONFIRMED !== "true") return false;
  const hosts = (process.env.OMNIFY_ALLOWED_STREAM_HOSTS || "").split(",").map((host) => host.trim().toLowerCase()).filter(Boolean);
  try { const hostname = new URL(url).hostname.toLowerCase(); return hosts.some((host) => hostname === host || hostname.endsWith(`.${host}`)); }
  catch { return false; }
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
  const stream = findStream(unwrapData(payload));
  const canPlay = !!stream && isAllowed(stream.url);
  return <><Navbar /><main className="container py-8 md:py-12">
    <Link href={`/anime/${encodeURIComponent(id)}`} className="text-sm muted hover:text-white">← Kembali ke detail anime</Link>
    <p className="eyebrow mt-7">NIME SPACE PLAYER</p><h1 className="mt-2 font-display text-3xl font-bold">Episode {episode}</h1>
    {canPlay && stream ? <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-black">
      {stream.kind === "embed" ? <iframe src={stream.url} title={`Episode ${episode}`} className="aspect-video w-full" allow="fullscreen; picture-in-picture" allowFullScreen referrerPolicy="no-referrer" /> : <video src={stream.url} controls playsInline className="aspect-video w-full" />}
    </div> : <div className="mt-6 rounded-2xl border border-line bg-panel p-6 md:p-10"><div className="mx-auto max-w-xl text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-line bg-black text-2xl">▶</div><h2 className="mt-5 text-xl font-bold">Pemutar belum diaktifkan</h2><p className="mt-3 text-sm leading-7 text-gray-400">{error ? `Data episode belum berhasil dimuat: ${error}` : stream ? "Sumber video tersedia, tetapi domain atau izin distribusinya belum dikonfirmasi oleh pengelola." : "API belum mengembalikan sumber video yang dapat diputar untuk episode ini."}</p><p className="mt-4 text-xs leading-6 text-gray-500">Untuk mengaktifkan pemutaran, pengelola harus memastikan sumber memiliki hak distribusi, lalu mengatur STREAMING_RIGHTS_CONFIRMED=true dan OMNIFY_ALLOWED_STREAM_HOSTS pada environment server.</p></div></div>}
    <div className="mt-5 rounded-xl border border-line p-4 text-xs leading-6 text-gray-500">Jangan aktifkan pemutaran untuk sumber yang tidak memiliki izin distribusi. NIME SPACE hanya memutar sumber yang telah diverifikasi.</div>
  </main></>;
}
