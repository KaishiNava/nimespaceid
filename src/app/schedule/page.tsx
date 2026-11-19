import Navbar from "@/components/Navbar";
import { animeRequest } from "@/lib/anime";

export default async function Schedule() {
  let data: unknown = null;
  try {
    data = await animeRequest("/anime/schedule?day=senin");
  } catch (error) {
    console.error("Schedule failed to load:", error);
  }

  return (
    <>
      <Navbar />
      <main className="container py-12">
        <p className="eyebrow">RELEASE CALENDAR</p>
        <h1 className="mt-2 font-display text-4xl font-bold">Schedule</h1>
        <p className="mt-3 muted">Jadwal rilis dari penyedia API.</p>
        <pre className="mt-8 overflow-auto rounded-2xl border border-line bg-panel p-5 text-xs text-gray-300">
          {data !== null ? JSON.stringify(data, null, 2) : "Schedule belum dapat dimuat. Periksa OMNIFY_API_KEY dan status API."}
        </pre>
      </main>
    </>
  );
}
