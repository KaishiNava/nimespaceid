import Navbar from "@/components/Navbar";
import {createClient} from "@/lib/supabase/server";
import {redirect} from "next/navigation";
import ProfileStudio from "@/components/ProfileStudio";
import PremiumHub from "@/components/PremiumHub";

export default async function Profile(){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user) redirect("/login");
 const {data:profile}=await supabase.from("profiles").select("*").eq("id",user.id).maybeSingle();
 const [{data:banners},{data:borders}] = await Promise.all([
  supabase.from("banner_assets").select("*").eq("active",true).order("created_at",{ascending:false}),
  supabase.from("border_assets").select("*").eq("active",true).order("created_at",{ascending:false})
 ]);
 const metadata = user.user_metadata || {};
 const fallbackAvatar = [metadata.avatar_url, metadata.picture, metadata.photo_url].find((value) => typeof value === "string" && value.trim()) || null;
 return <><Navbar/><main className="container py-10"><p className="eyebrow mb-5">YOUR SPACE</p><ProfileStudio profile={profile} banners={banners||[]} borders={borders||[]} fallbackAvatar={fallbackAvatar}/><div className="mt-8"><PremiumHub member={profile ? { id: user.id, role: profile.role, premium_expires_at: profile.premium_expires_at, username: profile.username } : { id: user.id, role: "free" }}/></div></main></>;
}
