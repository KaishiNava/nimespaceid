"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanUsername = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) {
      setMessage("Username harus 3–20 karakter dan hanya boleh berisi huruf kecil, angka, atau underscore.");
      return;
    }

    setBusy(true);
    setMessage("");
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { username: cleanUsername, display_name: username.trim() } },
    });

    if (error) {
      setMessage(error.message);
      setBusy(false);
      return;
    }

    if (data.session) {
      router.push("/profile");
      router.refresh();
    } else {
      setMessage("Akun berhasil dibuat. Periksa email untuk menyelesaikan verifikasi sebelum masuk.");
    }
    setBusy(false);
  }

  return (
    <main className="grid min-h-screen place-items-center p-5">
      <form onSubmit={submit} className="glass w-full max-w-md rounded-3xl p-8">
        <Link href="/" className="font-display text-sm tracking-widest">NS / NIME SPACE</Link>
        <h1 className="mt-8 font-display text-3xl font-bold">Create account.</h1>
        <p className="mt-2 text-sm muted">Your own space starts here.</p>
        <input required minLength={3} maxLength={20} value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Username" autoComplete="username" className="mt-8 w-full rounded-xl border border-line bg-black/40 p-3" />
        <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" autoComplete="email" className="mt-3 w-full rounded-xl border border-line bg-black/40 p-3" />
        <input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password (min. 8 characters)" autoComplete="new-password" className="mt-3 w-full rounded-xl border border-line bg-black/40 p-3" />
        {message && <p role="status" className="mt-3 text-sm text-gray-300">{message}</p>}
        <button disabled={busy} className="btn mt-5 w-full" type="submit">{busy ? "Creating..." : "Create account"}</button>
        <p className="mt-5 text-center text-sm muted">Already registered? <Link className="text-white underline" href="/login">Sign in</Link></p>
      </form>
    </main>
  );
}
