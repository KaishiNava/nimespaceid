import Navbar from "@/components/Navbar";
import { animeRequest, animeImage, animeTitle, extractAnimeDetail } from "@/lib/anime";
import Link from "next/link";

function textValue(value: unknown, fallback = "Belum tersedia") {
  return typeof value === "string" || typeof value === "number" ? String(value) : fallback;
}

export const dynamic = "force-dynamic";

export default async function AnimeDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let payload: unknown = null;
  let failed = false;
  try { payload = await animeRequest(`/anime/detail?id=${encodeURIComponent(id)}`); }
  catch (error) { failed = true; console.error("Anime detail failed:", error); }

  const anime = extractAnimeDetail(payload);
  if (!anime || failed) return <><Navbar /><main className="container py-16"><div className="card p-8"><h1 className="font-display text-2xl font-bold">Detail belum tersedia</h1><p className="muted mt-3">Data anime tidak berhasil dimuat. Coba kembali beberapa saat lagi.</p><Link className="btn btn-outline mt-6" href="/explore">Kembali ke Explore</Link></div></main></>;

  const title = animeTitle(anime);
  const image = animeImage(anime);
  const synopsis = textValue(anime.synopsis || anime.description || anime.summary, "Sinopsis belum tersedia dari API.");
  const genres = Array.isArray(anime.genres) ? anime.genres.filter((g): g is string => typeof g === "string") : [];
  const episodeData = Array.isArray(anime.episodes) ? anime.episodes : Array.isArray(anime.episode_list) ? anime.episode_list : [];
  const episodeCount = typeof anime.episodes === "number" || typeof anime.episodes === "string" ? anime.episodes : episodeData.length;
  const metadata: [string, unknown][] = [
    ["Status", anime.status], ["Tipe", anime.type], ["Studio", anime.studio],
    ["Rilis", anime.aired || anime.release_date], ["Episode", episodeCount || anime.total_episodes],
    ["Rating", anime.rating || anime.score],
  ].filter((entry) => entry[1] !== undefined && entry[1] !== null && entry[1] !== "");

  return <><Navbar /><main className="container py-8 md:py-14">
    <div className="grid gap-7 md:grid-cols-[260px_minmax(0,1fr)] md:gap-10">
      <div className="mx-auto w-full max-w-[260px] md:mx-0">{image ? <img src={image} alt={title} className="w-full rounded-2xl border border-line bg-panel object-cover shadow-2xl" /> : <div className="poster grid place-items-center rounded-2xl p-5 text-center text-gray-500">Poster belum tersedia</div>}</div>
      <section className="min-w-0"><p className="eyebrow">ANIME DETAILS</p><h1 className="mt-3 font-display text-3xl font-bold leading-tight md:text-5xl">{title}</h1>
        {typeof anime.alternative_title === "string" && <p className="mt-2 text-sm muted">{anime.alternative_title}</p>}
        <div className="mt-5 flex flex-wrap gap-2">{genres.map((genre) => <span className="rounded-full border border-line px-3 py-1.5 text-xs text-gray-300" key={genre}>{genre}</span>)}</div>
        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">{metadata.map(([label, value]) => <div key={String(label)} className="rounded-xl border border-line bg-panel p-3"><p className="text-[10px] uppercase tracking-wider muted">{label}</p><p className="mt-1 line-clamp-2 text-sm font-semibold">{textValue(value)}</p></div>)}</div>
        <div className="mt-8"><h2 className="font-display text-xl font-bold">Sinopsis</h2><p className="mt-3 whitespace-pre-line text-sm leading-7 text-gray-300 md:text-base md:leading-8">{synopsis}</p></div>
        {episodeData.length > 0 && <section className="mt-9"><div className="flex items-center justify-between"><h2 className="font-display text-xl font-bold">Daftar Episode</h2><span className="text-xs muted">{episodeData.length} episode dari API</span></div><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">{episodeData.map((ep, index) => { const obj = typeof ep === "object" && ep !== null ? ep as Record<string, unknown> : {}; const epNo = textValue(obj.episode || obj.episode_number || obj.number || obj.ep || index + 1); const epId = textValue(obj.id || obj.episode_id, `${id}-ep-${epNo}`); return <Link key={`${epId}-${index}`} href={`/watch/${encodeURIComponent(id)}?episode=${encodeURIComponent(epNo)}&episodeId=${encodeURIComponent(epId)}`} className="rounded-xl border border-line bg-panel px-4 py-3 text-sm hover:border-gray-500">Episode {epNo}<span className="mt-1 block text-xs muted">Buka detail tontonan →</span></Link>; })}</div></section>}
        <div className="mt-8 rounded-xl border border-line bg-panel p-4 text-xs leading-6 text-gray-400">Pemutaran video hanya akan diaktifkan untuk sumber yang hak distribusinya telah dikonfirmasi dan domain-nya diizinkan oleh pengelola NIME SPACE.</div>
        <details className="mt-6"><summary className="cursor-pointer text-sm text-gray-400">Informasi teknis API</summary><pre className="mt-3 max-h-80 overflow-auto rounded-xl bg-black p-4 text-xs text-gray-400">{JSON.stringify(payload, null, 2)}</pre></details>
        <Link className="btn btn-outline mt-7" href="/explore">Kembali ke Explore</Link>
      </section>
    </div>
  </main></>;
}
