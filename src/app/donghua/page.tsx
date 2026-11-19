import Navbar from "@/components/Navbar";
import AnimeGrid from "@/components/AnimeGrid";
import { animeRequest, extractItems, type Anime } from "@/lib/anime";

export default async function Donghua() {
  let items: Anime[] = [];
  try {
    items = extractItems(await animeRequest("/anime/donghua?page=1&per_page=30"));
  } catch (error) {
    console.error("Donghua page failed to load:", error);
  }

  return (
    <>
      <Navbar />
      <main className="container py-12">
        <p className="eyebrow">CHINESE ANIMATION</p>
        <h1 className="mt-2 mb-8 font-display text-4xl font-bold">Donghua</h1>
        <AnimeGrid items={items} />
      </main>
    </>
  );
}
