import type { Anime } from "@/lib/anime";
import { animeId, animeImage, animeTitle } from "@/lib/anime";
import Link from "next/link";
export default function AnimeGrid({items}:{items:Anime[]}) {
  if(!items.length) return <p className="muted py-10">Belum ada data yang dapat ditampilkan.</p>;
  return <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
    {items.map((a,i)=><Link className="card group" href={`/anime/${encodeURIComponent(animeId(a))}`} key={animeId(a)||i}>
      {animeImage(a)?<img className="poster" src={animeImage(a)} alt={animeTitle(a)} loading="lazy"/>:<div className="poster grid place-items-center p-4 text-center text-sm">{animeTitle(a)}</div>}
      <div className="p-3"><h3 className="line-clamp-2 text-sm font-semibold">{animeTitle(a)}</h3><p className="mt-1 text-xs muted">{String(a.status||"Anime")}</p></div>
    </Link>)}
  </div>;
}