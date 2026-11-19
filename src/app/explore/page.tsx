import Navbar from "@/components/Navbar";
import AnimeGrid from "@/components/AnimeGrid";
import { animeRequest, extractItems, type Anime } from "@/lib/anime";

export const dynamic = "force-dynamic";

export default async function Explore({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  let items: Anime[] = [];

  try {
    const endpoint = q.trim()
      ? `/anime/search?q=${encodeURIComponent(q.trim())}&page=1&per_page=36`
      : "/anime/list?page=1&per_page=36";
    items = extractItems(await animeRequest(endpoint));
  } catch (error) {
    console.error("Explore page failed to load:", error);
  }

  return (
    <>
      <Navbar />
      <main className="container py-12">
        <p className="eyebrow">DISCOVER</p>
        <h1 className="mt-2 font-display text-4xl font-bold">Explore anime</h1>
        <form className="my-8 flex max-w-xl gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search anime..."
            className="w-full rounded-xl border border-line bg-panel px-4 py-3 outline-none focus:border-white/50"
          />
          <button className="btn" type="submit">Search</button>
        </form>
        <AnimeGrid items={items} />
      </main>
    </>
  );
}
