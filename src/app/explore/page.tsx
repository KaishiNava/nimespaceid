import Navbar from "@/components/Navbar"; import AnimeGrid from "@/components/AnimeGrid"; import {animeRequest,extractItems} from "@/lib/anime";
export const dynamic="force-dynamic";
export default async function Explore({searchParams}:{searchParams:Promise<{q?:string}>}) {
 const {q=""}=await searchParams; let items=[];
 try { items=extractItems(await animeRequest(q?`/anime/search?q=${encodeURIComponent(q)}&page=1&per_page=36`:"/anime/list?page=1&per_page=36")); } catch {}
 return <><Navbar/><main className="container py-12"><p className="eyebrow">DISCOVER</p><h1 className="mt-2 font-display text-4xl font-bold">Explore anime</h1><form className="my-8 flex max-w-xl gap-2"><input name="q" defaultValue={q} placeholder="Search anime..." className="w-full rounded-xl border border-line bg-panel px-4 py-3 outline-none focus:border-white/50"/><button className="btn">Search</button></form><AnimeGrid items={items}/></main></>;
}