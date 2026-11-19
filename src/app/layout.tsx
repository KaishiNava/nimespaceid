import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
const jakarta = Plus_Jakarta_Sans({ subsets:["latin"], variable:"--font-jakarta" });
const space = Space_Grotesk({ subsets:["latin"], variable:"--font-space" });
export const metadata: Metadata = {
  title:"Nime Space — Your World of Anime",
  description:"Discover your next anime in Nime Space."
};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="id"><body className={`${jakarta.variable} ${space.variable}`}>{children}</body></html>;
}