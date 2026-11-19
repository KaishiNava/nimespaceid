import Link from "next/link";
import Navbar from "@/components/Navbar";
import { animeRequest, animeImage, animeTitle, animeId, extractSchedule } from "@/lib/anime";

export const dynamic = "force-dynamic";

const DAYS = ["senin", "selasa", "rabu", "kamis", "jumat", "sabtu", "minggu"];
const LABELS: Record<string, string> = {
  senin: "Senin", selasa: "Selasa", rabu: "Rabu", kamis: "Kamis",
  jumat: "Jumat", sabtu: "Sabtu", minggu: "Minggu",
};

export default async function Schedule({ searchParams }: { searchParams: Promise<{ day?: string }> }) {
  const params = await searchParams;
  const today = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", weekday: "long" }).format(new Date()).toLowerCase();
  const selected = DAYS.includes((params.day || today).toLowerCase()) ? (params.day || today).toLowerCase() : "senin";
  let items: ReturnType<typeof extractSchedule>["items"] = [];
  let apiDay = "";
  let error = "";
  try {
    const payload = await animeRequest(`/anime/schedule?day=${selected}`);
    const result = extractSchedule(payload);
    items = result.items;
    apiDay = result.day;
  } catch (e) {
    error = e instanceof Error ? e.message : "Jadwal gagal dimuat.";
    console.error("Schedule failed:", e);
  }

  return <><Navbar /><main className="container py-10 md:py-14">
    <p className="eyebrow">RELEASE CALENDAR · WIB</p>
    <div className="mt-2 flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-display text-4xl font-bold md:text-5xl">Jadwal Tayang</h1><p className="muted mt-3">Jadwal episode anime berdasarkan hari penayangan.</p></div><span className="rounded-full border border-line px-4 py-2 text-xs text-gray-300">Asia/Jakarta · WIB</span></div>
    <div className="mt-8 grid grid-cols-4 gap-2 sm:grid-cols-7">{DAYS.map((day) => <Link key={day} href={`/schedule?day=${day}`} className={`rounded-xl border px-2 py-3 text-center text-sm transition ${selected === day ? "border-white bg-white text-black font-bold" : "border-line bg-panel text-gray-300 hover:border-gray-500"}`}>{LABELS[day]}</Link>)}</div>
    <div className="mt-8 flex items-center justify-between"><h2 className="font-display text-2xl font-bold">{LABELS[selected]}</h2><span className="text-sm muted">{items.length} judul</span></div>
    {error ? <div className="card mt-5 p-5 text-sm text-amber-200">Jadwal belum dapat dimuat. {error}</div> : items.length === 0 ? <div className="card mt-5 p-8 text-center muted">Belum ada jadwal untuk hari ini.</div> : <div className="mt-5 grid gap-3">{items.map((item, index) => {
      const id = animeId(item); const poster = animeImage(item); const time = String(item.air_time || item.time || "Waktu belum tersedia");
      return <article key={`${id}-${index}`} className="card flex min-h-32 gap-4 p-3 sm:gap-5 sm:p-4">
        <div className="w-20 shrink-0 overflow-hidden rounded-lg bg-[#202329] sm:w-24">{poster ? <img src={poster} alt={animeTitle(item)} className="h-full min-h-28 w-full object-cover" loading="lazy" /> : <div className="grid h-full min-h-28 place-items-center p-2 text-center text-[10px] text-gray-500">NIME SPACE</div>}</div>
        <div className="min-w-0 flex-1 py-1"><div className="flex flex-wrap items-center gap-2"><span className="rounded-md bg-white px-2.5 py-1 text-xs font-bold text-black">{time.replace(/\s*WIB/i, "")}</span><span className="text-[10px] uppercase tracking-wider text-gray-500">WIB</span></div><h3 className="mt-3 line-clamp-2 font-semibold leading-snug">{animeTitle(item)}</h3><p className="mt-2 text-xs muted">{Array.isArray(item.genres) ? item.genres.slice(0, 3).join(" · ") : "Anime"}</p></div>
        {id && <Link href={`/anime/${encodeURIComponent(id)}`} className="self-center rounded-lg border border-line px-3 py-2 text-xs font-semibold hover:bg-white hover:text-black">Detail</Link>}
      </article>;
    })}</div>}
    <p className="mt-6 text-xs leading-6 text-gray-500">Jadwal mengikuti data yang disediakan API OmnifyAnime dan dapat berubah sewaktu-waktu.</p>
  </main></>;
}
