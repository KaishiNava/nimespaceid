export type Anime = {
  id?: string | number;
  slug?: string;
  title?: string;
  name?: string;
  poster?: string;
  image?: string;
  thumbnail?: string;
  synopsis?: string;
  description?: string;
  status?: string;
  episodes?: number | string;
  genres?: string[];
  [key: string]: unknown;
};

type ApiPayload = {
  data?: unknown;
  results?: unknown;
  items?: unknown;
  anime?: unknown;
  [key: string]: unknown;
};

const BASE = (process.env.OMNIFY_API_BASE || "https://anime.omnifylabs.sbs").replace(/\\/$/, "");

export async function animeRequest(path: string): Promise<unknown> {
  const key = process.env.OMNIFY_API_KEY;
  if (!key) throw new Error("OMNIFY_API_KEY belum diatur.");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const response = await fetch(`${BASE}${normalizedPath}`, {
    headers: { "X-API-Key": key, Accept: "application/json" },
    next: { revalidate: 300 },
  });
  if (!response.ok) {
    throw new Error(`OmnifyAnime API error: ${response.status}`);
  }
  return response.json() as Promise<unknown>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function extractItems(payload: unknown): Anime[] {
  if (!isRecord(payload)) return [];
  const data = payload.data;
  const candidates: unknown[] = [
    data,
    isRecord(data) ? data.items : undefined,
    isRecord(data) ? data.anime : undefined,
    payload.results,
    payload.items,
  ];
  const found = candidates.find(Array.isArray);
  return Array.isArray(found) ? found.filter(isRecord) as Anime[] : [];
}

export function animeTitle(anime: Anime): string {
  return String(anime.title || anime.name || "Untitled Anime");
}

export function animeImage(anime: Anime): string {
  return String(anime.poster || anime.image || anime.thumbnail || "");
}

export function animeId(anime: Anime): string {
  return String(anime.id || anime.slug || "");
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  return isRecord(value) ? value : null;
}
