import Navbar from "@/components/Navbar";
import {createClient} from "@/lib/supabase/server";
import {redirect} from "next/navigation";
import ProfileStudio from "@/components/ProfileStudio";

export default async function Profile(){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user) redirect("/login");
 const {data:profile}=await supabase.from("profiles").select("*").eq("id",user.id).maybeSingle();
 const [{data:banners},{data:borders}] = await Promise.all([
  supabase.from("banner_assets").select("*").eq("active",true).order("created_at",{ascending:false}),
  supabase.from("border_assets").select("*").eq("active",true).order("created_at",{ascending:false})
 ]);
 return <><Navbar/><main className="container py-10"><p className="eyebrow mb-5">YOUR SPACE</p><ProfileStudio profile={profile} banners={banners||[]} borders={borders||[]} userEmail={user.email||""}/></main></>;
}
