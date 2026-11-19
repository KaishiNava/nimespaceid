# NIME SPACE

Premium black-and-white anime discovery platform starter built with Next.js 15, TypeScript, Tailwind CSS, Supabase Auth and OmnifyAnime API.

## Requirements
- Node.js 20+
- Supabase project
- Private OmnifyAnime API key supplied by the API provider

## Setup
1. Extract the ZIP and open the folder.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Fill Supabase URL and anon key.
5. Fill `OMNIFY_API_KEY` with your own valid private key. Do not expose it in `NEXT_PUBLIC_*`.
6. In Supabase SQL Editor, run `supabase/schema.sql`.
7. In Supabase Authentication settings, configure your site URL and email redirect URLs.
8. Run `npm run dev`.

## Deploy
Push to GitHub, import the repository into Vercel, and add the same environment variables in Vercel Project Settings.

## Included
- Responsive black/white brand and typography
- Main navigation (desktop and mobile)
- Home, Explore, Schedule, Movies, Donghua, anime detail
- Supabase email/password register and login
- Profile starter with member ID, role label, level and tier display
- Server-side OmnifyAnime proxy route at `/api/anime/...`
- Supabase schema for profiles, cosmetics, bookmarks and history

## Important implementation notes
- The API homepage reports OmnifyAnime v1.3.0 as Development / unfinished. Response formats may vary; verify each endpoint against live responses before relying on it.
- The public documentation currently displays a temporary API key. This project intentionally does not copy that key. Obtain/rotate a private key from the provider and put it in `OMNIFY_API_KEY`.
- The anime API supplies metadata. This starter does not scrape or embed unauthorized video streams. Add playback only for video sources you have permission to distribute.
- Rank thresholds beyond A are initial proposal: S 3001–5000, SS 5001–10000, SSS 10001–20000, SSS+ 20001–35000, SSS++ 35001–50000, SSS+++ 50001+. Admin/Owner Black Hole tier is represented as a visual profile state, not an EXP exploit.
- Admin/Owner privileges must be assigned securely by trusted server-side administration. Never allow users to update their own role, level, total_exp, or public_id. Tighten the profile update RLS policy before production so users can only update editable columns.
- Border/banner GitHub upload management and owner dashboard are planned next. Asset metadata tables are included; upload route is not enabled in this starter.
- The level EXP curve and exact rank-up EXP thresholds are intentionally not invented yet; only level-to-tier ranges are shown.
