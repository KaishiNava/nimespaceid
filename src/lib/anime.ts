export type Anime = {
  id?: string | number;
  slug?: string;
  title?: string;
  name?: string;
  poster?: string;
  poster_url?: string;
  image?: string;
  image_url?: string;
  thumbnail?: string;
  cover?: string;
  cover_url?: string;
  synopsis?: string;
  description?: string;
  status?: string;
  episodes?: number | string | unknown[];
  genres?: string[];
  [key: string]: unknown;
};

const BASE = (process.env.OMNIFY_API_BASE || "https://anime.omnifylabs.sbs").replace(/\/$/, "");

export async function animeRequest(path: string): Promise<unknown> {
  const key = process.env.OMNIFY_API_KEY;
  if (!key) throw new Error("OMNIFY_API_KEY belum diatur.");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const response = await fetch(`${BASE}${normalizedPath}`, {
    headers: { "X-API-Key": key, Accept: "application/json" },
    next: { revalidate: 180 },
  });
  if (!response.ok) throw new Error(`OmnifyAnime API error: ${response.status}`);
  return response.json() as Promise<unknown>;
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
}

export function unwrapData(payload: unknown): unknown {
  const root = asRecord(payload);
  if (!root) return payload;
  return root.data ?? root.result ?? root.results ?? root.anime ?? payload;
}

export function extractItems(payload: unknown): Anime[] {
  const root = asRecord(payload);
  const data = unwrapData(payload);
  const dataRecord = asRecord(data);
  const candidates: unknown[] = [
    data,
    dataRecord?.items,
    dataRecord?.anime,
    dataRecord?.results,
    root?.items,
    root?.results,
  ];
  const found = candidates.find(Array.isArray);
  return Array.isArray(found) ? found.filter((item) => asRecord(item) !== null) as Anime[] : [];
}

export function animeTitle(anime: Anime): string {
  return String(anime.title || anime.name || anime.english_title || anime.japanese_title || "Untitled Anime");
}

export function animeImage(anime: Anime): string {
  const value = anime.poster || anime.poster_url || anime.image || anime.image_url ||
    anime.thumbnail || anime.cover || anime.cover_url || anime.banner;
  return typeof value === "string" ? value : "";
}

export function animeId(anime: Anime): string {
  return String(anime.id || anime.slug || anime.anime_id || "");
}

export function extractSchedule(payload: unknown): { day: string; items: Anime[] } {
  const data = unwrapData(payload);
  if (Array.isArray(data)) {
    const dayGroup = data.map(asRecord).find((entry) => entry && Array.isArray(entry.items));
    if (dayGroup) return { day: String(dayGroup.day || ""), items: dayGroup.items as Anime[] };
    return { day: "", items: data.filter((item) => asRecord(item)) as Anime[] };
  }
  const record = asRecord(data);
  if (record && Array.isArray(record.items)) {
    return { day: String(record.day || ""), items: record.items.filter((item) => asRecord(item)) as Anime[] };
  }
  return { day: "", items: extractItems(payload) };
}

export function extractAnimeDetail(payload: unknown): Record<string, unknown> | null {
  let current: unknown = payload;
  for (let i = 0; i < 4; i++) {
    const record = asRecord(current);
    if (!record) return null;
    const nested = record.anime ?? record.detail ?? record.data ?? record.result;
    if (!nested || nested === current) return record;
    current = nested;
  }
  return asRecord(current);
}
