import Navbar from "@/components/Navbar";
import AnimeGrid from "@/components/AnimeGrid";
import { animeRequest,extractItems } from "@/lib/anime";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PremiumHub from "@/components/PremiumHub";
async function getLatest(){try{return extractItems(await animeRequest("/anime/latest?page=1&per_page=18"));}catch{return [];}}
async function getPopular(){try{return extractItems(await animeRequest("/anime/popular?period=weekly&page=1&per_page=6"));}catch{return [];}}
export default async function Home(){
 const [latest,popular]=await Promise.all([getLatest(),getPopular()]);
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 const {data:member}=user?await supabase.from("profiles").select("id,role,premium_expires_at,username").eq("id",user.id).maybeSingle():{data:null};
 return <><Navbar/><main>
  <section className="container pt-12 md:pt-20">
   <div className="relative overflow-hidden rounded-[28px] border border-white/15 bg-[radial-gradient(ellipse_at_80%_10%,#353940_0%,transparent_42%),linear-gradient(120deg,#191c21,#090a0c_65%)] p-8 md:p-16">
    <div className="absolute -right-16 -top-24 h-80 w-80 rounded-full border border-white/10"/><div className="absolute -right-5 -top-14 h-60 w-60 rounded-full border border-white/10"/>
    <p className="eyebrow">YOUR WORLD OF ANIME</p><h1 className="mt-5 max-w-2xl font-display text-4xl font-bold leading-tight md:text-6xl">Find your next <span className="text-gray-400">favorite story.</span></h1>
    <p className="mt-5 max-w-xl text-sm leading-7 text-gray-400 md:text-base">Explore anime, discover new worlds, and build your own watchlist in one space.</p>
    <div className="mt-8 flex flex-wrap gap-3"><Link className="btn" href="/explore">Explore anime</Link><Link className="btn btn-outline" href="/schedule">View schedule</Link></div>
   </div>
  </section>
  <section className="container pt-8"><PremiumHub member={member ? {id:user!.id,role:member.role,premium_expires_at:member.premium_expires_at,username:member.username} : null} compact/></section>
  <section className="container py-12"><div className="mb-6 flex items-end justify-between"><div><p className="eyebrow">THIS WEEK</p><h2 className="mt-2 font-display text-2xl font-bold">Popular anime</h2></div><Link className="text-sm muted" href="/explore">See all →</Link></div><AnimeGrid items={popular}/></section>
  <section className="container pb-20"><div className="mb-6"><p className="eyebrow">FRESH FROM THE UNIVERSE</p><h2 className="mt-2 font-display text-2xl font-bold">Recently updated</h2></div><AnimeGrid items={latest}/></section>
 </main><footer className="border-t border-line py-8 text-center text-xs muted">© {new Date().getFullYear()} NIME SPACE. Built for anime fans.</footer></>;
}