"use client";

import { useEffect, useRef, useState } from "react";

type Source = { url: string; label: string; type: "video" | "hls" | "embed" };

export default function StreamPlayer({ sources, title }: { sources: Source[]; title: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [selected, setSelected] = useState(0);
  const [error, setError] = useState("");
  const source = sources[selected];

  useEffect(() => {
    let hls: { destroy: () => void } | null = null;
    let cancelled = false;
    setError("");
    const video = videoRef.current;
    if (!video || !source || source.type === "embed") return;

    const load = async () => {
      const isHls = source.type === "hls" || /\.m3u8(?:$|[?#])/i.test(source.url);
      if (isHls && !video.canPlayType("application/vnd.apple.mpegurl")) {
        try {
          const Hls = (await import("hls.js")).default;
          if (cancelled) return;
          if (Hls.isSupported()) {
            const instance = new Hls({ enableWorker: true, maxBufferLength: 30 });
            hls = instance;
            instance.loadSource(source.url);
            instance.attachMedia(video);
            instance.on(Hls.Events.ERROR, (_event, data) => {
              if (data.fatal) setError("Video tidak dapat dimuat dari sumber ini. Coba sumber lain.");
            });
          } else setError("Browser ini tidak mendukung format HLS.");
        } catch {
          setError("Modul pemutar HLS belum tersedia. Jalankan npm install lalu build ulang.");
        }
      } else video.src = source.url;
    };
    void load();
    return () => { cancelled = true; hls?.destroy(); video.pause(); video.removeAttribute("src"); video.load(); };
  }, [source]);

  if (!source) return null;
  return <section className="mt-6 overflow-hidden rounded-2xl border border-line bg-black">
    {sources.length > 1 && <div className="flex flex-wrap gap-2 border-b border-white/10 bg-panel p-3">
      {sources.map((item, index) => <button key={`${item.url}-${index}`} onClick={() => setSelected(index)} className={`rounded-lg px-3 py-2 text-xs ${selected === index ? "bg-white text-black" : "border border-line text-gray-300"}`}>{item.label}</button>)}
    </div>}
    {source.type === "embed" ? <iframe key={source.url} src={source.url} title={title} className="aspect-video w-full" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" sandbox="allow-scripts allow-same-origin allow-presentation allow-forms" /> : <video ref={videoRef} controls playsInline preload="metadata" crossOrigin="anonymous" className="aspect-video w-full" onError={() => setError("Video gagal diputar. Periksa URL, format, izin embed, dan dukungan CORS dari penyedia.")} />}
    {error && <p role="status" className="bg-panel px-4 py-3 text-sm text-amber-300">{error}</p>}
  </section>;
}
