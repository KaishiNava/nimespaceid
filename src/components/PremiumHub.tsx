"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Gift, Crown, Sparkles, Clock3 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Member = { id: string; role: string; premium_expires_at?: string | null; username?: string; display_name?: string | null };
type Giveaway = { id: string; title: string; description: string; duration_days: number; max_claims: number; claimed_count: number; active: boolean; created_at: string };

export default function PremiumHub({ member, compact = false }: { member: Member | null; compact?: boolean }) {
  const supabase = useMemo(() => createClient(), []);
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [claimed, setClaimed] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [days, setDays] = useState(1);
  const [slots, setSlots] = useState(10);
  const isAdmin = member?.role === "admin" || member?.role === "owner";
  const unlimited = isAdmin;
  const expiry = member?.premium_expires_at ? new Date(member.premium_expires_at) : null;
  const activePremium = member?.role === "premium" && !!expiry && expiry.getTime() > Date.now();
  const remainingDays = activePremium && expiry ? Math.max(1, Math.ceil((expiry.getTime() - Date.now()) / 86400000)) : 0;

  async function refresh() {
    const { data } = await supabase.from("premium_giveaways").select("*").eq("active", true).order("created_at", { ascending: false }).limit(30);
    setGiveaways((data || []) as Giveaway[]);
    if (member) {
      const { data: claims } = await supabase.from("premium_giveaway_claims").select("giveaway_id").eq("user_id", member.id);
      setClaimed((claims || []).map((row: any) => row.giveaway_id));
    }
  }
  useEffect(() => { void refresh(); }, [member?.id]);

  async function claim(id: string) {
    if (!member) { window.location.href = "/login"; return; }
    setBusy(id); setNotice("");
    const { data, error } = await supabase.rpc("claim_premium_giveaway", { target_giveaway_id: id });
    const result = Array.isArray(data) ? data[0] : data;
    if (error) setNotice(`Gagal claim: ${error.message}`);
    else setNotice(result?.message || "Permintaan claim selesai.");
    await refresh(); setBusy("");
    if (result?.success) window.location.reload();
  }

  async function createGiveaway() {
    if (!member || !isAdmin) return;
    setBusy("create"); setNotice("");
    const { error } = await supabase.from("premium_giveaways").insert({
      title: title.trim() || `Premium ${days} Hari`, description: description.trim(), duration_days: days,
      max_claims: slots, created_by: member.id, active: true,
    });
    if (error) setNotice(`Gagal membuat giveaway: ${error.message}`);
    else { setNotice("Giveaway premium berhasil dibuat."); setTitle(""); setDescription(""); await refresh(); }
    setBusy("");
  }

  return <section className={`premium-hub ${compact ? "premium-hub-compact" : ""}`}>
    <div className="premium-hub-head"><div className="premium-icon"><Crown size={21}/></div><div><p className="eyebrow">NIME SPACE MEMBERSHIP</p><h2>Premium</h2></div></div>
    {unlimited ? <div className="premium-status unlimited"><Sparkles size={18}/><div><strong>Premium Unlimited</strong><span>Role {member?.role} tidak memiliki batas masa aktif.</span></div></div>
      : activePremium ? <div className="premium-status active"><Clock3 size={18}/><div><strong>{remainingDays} hari Premium tersisa</strong><span>Berakhir {expiry?.toLocaleDateString("id-ID", { dateStyle: "long" })}</span></div></div>
      : <div className="premium-status inactive"><div><strong>Belum memiliki Premium</strong><span>Coba Premium mulai dari <b>Rp12.000/bulan</b>.</span></div><Link href="/profile" className="premium-cta">Lihat Premium</Link></div>}
    <div className="giveaway-heading"><div><p className="eyebrow">COMMUNITY REWARDS</p><h3><Gift size={17}/> Premium Giveaway</h3></div><span>{giveaways.length} aktif</span></div>
    {giveaways.length === 0 ? <p className="premium-empty">Belum ada giveaway aktif. Pantau halaman ini untuk hadiah Premium dari komunitas.</p> : <div className="giveaway-list">{giveaways.map((item) => {
      const full = item.claimed_count >= item.max_claims;
      const already = claimed.includes(item.id);
      return <article className="giveaway-card" key={item.id}><div><strong>{item.title}</strong><p>{item.description || `Hadiah Premium ${item.duration_days} hari untuk ${item.max_claims} pengguna.`}</p><small>{item.duration_days} hari Premium · {item.claimed_count}/{item.max_claims} sudah claim</small></div><button className="btn" disabled={full || already || !member || !!busy || unlimited} onClick={() => void claim(item.id)}>{already ? "Sudah claim" : full ? "Kuota habis" : !member ? "Masuk untuk claim" : unlimited ? "Unlimited" : busy === item.id ? "Memproses..." : "Claim"}</button></article>;
    })}</div>}
    {notice && <p className="premium-notice" role="status">{notice}</p>}
    {isAdmin && <div className="giveaway-admin"><p className="eyebrow">ADMIN / OWNER</p><h3>Buat Premium Giveaway</h3><div className="premium-form-grid"><label>Nama giveaway<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`Premium ${days} Hari`}/></label><label>Durasi hadiah<select value={days} onChange={(e) => setDays(Number(e.target.value))}><option value={1}>1 hari</option><option value={3}>3 hari</option><option value={7}>7 hari</option><option value={30}>30 hari</option></select></label><label>Jumlah pemenang<input type="number" min={1} max={500} value={slots} onChange={(e) => setSlots(Math.max(1, Math.min(500, Number(e.target.value))))}/></label><label className="premium-description">Keterangan<input value={description} maxLength={300} onChange={(e) => setDescription(e.target.value)} placeholder="Contoh: Giveaway komunitas episode minggu ini"/></label></div><p className="premium-cost-note">Total hadiah: {days * slots} hari Premium untuk {slots} akun (durasi per akun {days} hari).</p><button className="btn" disabled={busy === "create" || slots < 1} onClick={() => void createGiveaway()}>{busy === "create" ? "Membuat..." : "Buat giveaway"}</button></div>}
    {!member && <p className="premium-login-note"><Link href="/login">Masuk</Link> untuk melihat status Premium dan claim giveaway.</p>}
  </section>;
}
