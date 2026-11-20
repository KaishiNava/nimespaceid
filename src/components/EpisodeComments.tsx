"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MessageCircle, Send, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type CommentRow = { id: string; episode_id: string; user_id: string; body: string; created_at: string; profiles?: { username?: string; display_name?: string | null; role?: string; avatar_url?: string | null } | null };
export default function EpisodeComments({ animeId, episodeId }: { animeId: string; episodeId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<CommentRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState("free");
  const [body, setBody] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  async function refresh() {
    const { data: auth } = await supabase.auth.getUser();
    setUserId(auth.user?.id || null);
    if (auth.user) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", auth.user.id).maybeSingle();
      setRole(profile?.role || "free");
    }
    const { data, error } = await supabase.from("episode_comments").select("id,episode_id,user_id,body,created_at,profiles(username,display_name,role,avatar_url)").eq("episode_id", episodeId).order("created_at", { ascending: false }).limit(100);
    if (!error) setRows((data || []) as unknown as CommentRow[]);
    else setNotice(`Komentar belum dapat dimuat: ${error.message}. Jalankan migrasi premium_comments.sql.`);
  }
  useEffect(() => { void refresh(); }, [episodeId]);
  async function submit(event: FormEvent) {
    event.preventDefault(); if (!userId) { window.location.href = "/login"; return; }
    const text = body.trim(); if (!text) return;
    setBusy(true); setNotice("");
    const { error } = await supabase.from("episode_comments").insert({ episode_id: episodeId, anime_id: animeId, user_id: userId, body: text });
    if (error) setNotice(`Komentar gagal dikirim: ${error.message}`);
    else { setBody(""); await refresh(); }
    setBusy(false);
  }
  async function remove(id: string) {
    const { error } = await supabase.from("episode_comments").delete().eq("id", id);
    if (error) setNotice(error.message); else setRows((prev) => prev.filter((row) => row.id !== id));
  }
  return <section className="episode-comments"><div className="comments-title"><div><p className="eyebrow">COMMUNITY</p><h2><MessageCircle size={20}/> Diskusi Episode</h2></div><span>{rows.length} komentar</span></div>
    <form className="comment-form" onSubmit={submit}><textarea value={body} maxLength={500} onChange={(e) => setBody(e.target.value)} placeholder={userId ? "Tulis komentar tentang episode ini..." : "Masuk untuk ikut berkomentar..."}/><div><small>{body.length}/500</small><button className="btn" disabled={busy || !body.trim()}><Send size={15}/>{busy ? "Mengirim..." : "Kirim komentar"}</button></div></form>
    {notice && <p className="premium-notice" role="status">{notice}</p>}
    <div className="comment-list">{rows.length === 0 ? <p className="premium-empty">Belum ada komentar. Jadilah yang pertama memulai diskusi!</p> : rows.map((row) => { const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles; const name = profile?.display_name || profile?.username || "Member"; const canDelete = row.user_id === userId || role === "admin" || role === "owner"; return <article className="comment-item" key={row.id}><div className="comment-avatar">{name.slice(0,1).toUpperCase()}</div><div className="comment-content"><div className="comment-meta"><strong>{name}</strong>{profile?.role === "admin" || profile?.role === "owner" ? <span className="comment-role">ADMIN</span> : profile?.role === "premium" ? <span className="comment-role premium">PREMIUM</span> : null}<time>{new Date(row.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</time>{canDelete && <button aria-label="Hapus komentar" onClick={() => void remove(row.id)}><Trash2 size={14}/></button>}</div><p>{row.body}</p></div></article>; })}</div>
    {!userId && <p className="comment-login"><Link href="/login">Masuk</Link> untuk mengirim komentar.</p>}
  </section>;
}
