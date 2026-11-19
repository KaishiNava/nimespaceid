import Link from "next/link";
import { Search, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
export default async function Navbar() {
  const supabase = await createClient();
  const { data:{user} } = await supabase.auth.getUser();
  return <header className="sticky top-0 z-50 border-b border-line bg-[#08090b]/85 backdrop-blur-xl">
    <div className="container flex h-[76px] items-center justify-between gap-6">
      <Link href="/" className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/25 bg-white text-lg font-black text-black">NS</span>
        <span className="font-display text-lg font-bold tracking-[.12em]">NIME SPACE</span>
      </Link>
      <nav className="hidden items-center gap-7 text-sm text-gray-300 md:flex">
        <Link href="/">Home</Link><Link href="/explore">Explore</Link><Link href="/schedule">Schedule</Link><Link href="/movies">Movies</Link><Link href="/donghua">Donghua</Link>
      </nav>
      <div className="flex items-center gap-3">
        <Link aria-label="Search" href="/explore" className="rounded-lg border border-line p-2.5"><Search size={18}/></Link>
        <Link href={user?"/profile":"/login"} className="btn !rounded-lg !px-3 !py-2"><UserRound size={17}/><span className="hidden sm:inline">{user?"Profile":"Sign in"}</span></Link>
      </div>
    </div>
    <nav className="flex justify-around border-t border-line py-3 text-xs text-gray-400 md:hidden">
      <Link href="/">Home</Link><Link href="/explore">Explore</Link><Link href="/schedule">Schedule</Link><Link href="/movies">Movies</Link><Link href="/profile">Profile</Link>
    </nav>
  </header>;
}