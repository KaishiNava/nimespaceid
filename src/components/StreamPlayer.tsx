"use client";

import { useEffect, useRef, useState } from "react";

type Source = { url: string; label: string; type: "video" | "hls" | "embed" };

export default function StreamPlayer({ sources, title }: { sources: Source[]; title: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fallbackUsedRef = useRef(false);
  const [selected, setSelected] = useState(0);
  const [error, setError] = useState("");
  const source = sources[selected];

  useEffect(() => {
    let hls: { destroy: () => void } | null = null;
    let cancelled = false;
    fallbackUsedRef.current = false;
    setError("");
    const video = videoRef.current;
    if (!video || !source || source.type === "embed") return;

    const failover = (message: string) => {
      if (cancelled || fallbackUsedRef.current) return;
      fallbackUsedRef.current = true;
      if (selected < sources.length - 1) {
        setSelected(selected + 1);
      } else {
        setError(message);
      }
    };

    const load = async () => {
      const isHls = source.type === "hls" || /\.m3u8(?:$|[?#])/i.test(source.url);
      if (isHls) {
        try {
          const Hls = (await import("hls.js")).default;
          if (cancelled) return;
          // Prefer hls.js on browsers with Media Source Extensions (including Android Chrome).
          // Safari/iOS can fall back to its native HLS implementation.
          if (Hls.isSupported()) {
            const instance = new Hls({
              enableWorker: true,
              maxBufferLength: 30,
              lowLatencyMode: false,
              backBufferLength: 30,
              manifestLoadingMaxRetry: 2,
              levelLoadingMaxRetry: 2,
              fragLoadingMaxRetry: 2,
            });
            hls = instance;
            instance.on(Hls.Events.ERROR, (_event, data) => {
              if (data.fatal) failover(`HLS gagal dimuat${data.details ? ` (${data.details})` : ""}. Periksa akses playlist, segmen, dan CORS di server penyedia.`);
            });
            instance.loadSource(source.url);
            instance.attachMedia(video);
          } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = source.url;
            video.load();
          } else {
            failover("Browser ini tidak mendukung HLS melalui Media Source Extensions maupun pemutar native.");
          }
        } catch {
          failover("Modul HLS.js gagal dimuat. Pastikan dependensi hls.js terpasang saat build.");
        }
      } else {
        video.src = source.url;
        video.load();
      }
    };

    void load();
    return () => {
      cancelled = true;
      hls?.destroy();
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [source, selected, sources]);

  if (!source) return null;

  const handleVideoError = () => {
    if (fallbackUsedRef.current) return;
    fallbackUsedRef.current = true;
    if (selected < sources.length - 1) {
      setSelected(selected + 1);
      setError("");
    } else {
      const mediaError = videoRef.current?.error;
      const code = mediaError?.code;
      const detail = code === 2 ? "jaringan" : code === 3 ? "decode/format" : code === 4 ? "format atau MIME type" : "akses media";
      setError(`Video gagal dimuat (${detail}). Periksa status HTTP, URL stream, Content-Type, dan CORS dari penyedia.`);
    }
  };

  return <section className="mt-6 overflow-hidden rounded-2xl border border-line bg-black">
    {sources.length > 1 && <div className="flex flex-wrap gap-2 border-b border-white/10 bg-panel p-3">
      {sources.map((item, index) => <button key={`${item.url}-${index}`} onClick={() => { setSelected(index); setError(""); }} className={`rounded-lg px-3 py-2 text-xs ${selected === index ? "bg-white text-black" : "border border-line text-gray-300"}`}>{item.label}</button>)}
    </div>}
    {source.type === "embed" ? <iframe key={source.url} src={source.url} title={title} className="aspect-video w-full" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" sandbox="allow-scripts allow-same-origin allow-presentation allow-forms" /> : <video ref={videoRef} controls playsInline preload="metadata" className="aspect-video w-full" onError={handleVideoError} />}
    {error && <p role="status" className="bg-panel px-4 py-3 text-sm text-amber-300">{error}</p>}
  </section>;
}
