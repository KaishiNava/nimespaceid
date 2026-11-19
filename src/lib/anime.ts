export type Anime = {
  id?: string; slug?: string; title?: string; name?: string; poster?: string;
  image?: string; thumbnail?: string; synopsis?: string; status?: string;
  episodes?: number | string; genres?: string[]; [key: string]: unknown;
};
const BASE = (process.env.OMNIFY_API_BASE || "https://anime.omnifylabs.sbs").replace(/\/$/, "");
export async function animeRequest(path: string) {
  const key = process.env.OMNIFY_API_KEY;
  if (!key) throw new Error("OMNIFY_API_KEY belum diatur di .env.local");
  const response = await fetch(`${BASE}${path}`, {
    headers: { "X-API-Key": key, Accept: "application/json" },
    next: { revalidate: 300 }
  });
  if (!response.ok) throw new Error(`OmnifyAnime API error: ${response.status}`);
  return response.json();
}
export function extractItems(payload: any): Anime[] {
  const candidates = [payload?.data, payload?.data?.items, payload?.data?.anime, payload?.results, payload?.items];
  return candidates.find(Array.isArray) ?? [];
}
export function animeTitle(a: Anime) { return String(a.title || a.name || "Untitled Anime"); }
export function animeImage(a: Anime) { return String(a.poster || a.image || a.thumbnail || ""); }
export function animeId(a: Anime) { return String(a.id || a.slug || ""); }