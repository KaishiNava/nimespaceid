import Navbar from "@/components/Navbar";
import { animeRequest, asRecord } from "@/lib/anime";
import Link from "next/link";

export default async function AnimeDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let payload: unknown = null;
  try {
    payload = await animeRequest(`/anime/detail?id=${encodeURIComponent(id)}`);
  } catch (error) {
    console.error("Anime detail failed to load:", error);
  }

  const root = asRecord(payload);
  const anime = asRecord(root?.data) ?? asRecord(root?.anime) ?? root;
  const title = String(anime?.title || anime?.name || id);
  const image = String(anime?.poster || anime?.image || anime?.thumbnail || "");
  const synopsis = String(anime?.synopsis || anime?.description || "Sinopsis belum tersedia.");
  const genres = Array.isArray(anime?.genres) ? anime.genres.filter((genre): genre is string => typeof genre === "string") : [];

  return (
    <>
      <Navbar />
      <main className="container py-12">
        {!anime ? (
          <div className="card p-8">Anime tidak ditemukan atau API sedang tidak tersedia.</div>
        ) : (
          <div className="grid gap-8 md:grid-cols-[260px_1fr]">
            {image ? <img className="w-full rounded-2xl border border-line" src={image} alt={title} /> : <div className="poster rounded-2xl" />}
            <div>
              <p className="eyebrow">ANIME DETAILS</p>
              <h1 className="mt-3 font-display text-4xl font-bold">{title}</h1>
              <p className="mt-5 leading-8 text-gray-400">{synopsis}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {genres.map((genre) => <span className="rounded-full border border-line px-3 py-1 text-xs" key={genre}>{genre}</span>)}
              </div>
              <div className="mt-8 rounded-xl border border-line bg-panel p-4 text-sm text-gray-400">
                Informasi episode ditampilkan sesuai data API. Pemutaran hanya dapat diaktifkan untuk sumber video yang memiliki izin distribusi.
              </div>
              <details className="mt-6">
                <summary className="cursor-pointer text-sm">Raw API data</summary>
                <pre className="mt-3 overflow-auto rounded-xl bg-black p-4 text-xs">{JSON.stringify(payload, null, 2)}</pre>
              </details>
              <Link className="btn btn-outline mt-6" href="/explore">Back to explore</Link>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
