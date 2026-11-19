# NIME SPACE

Premium black-and-white anime discovery platform built with Next.js 15, TypeScript, Tailwind CSS, Supabase Auth, and the OmnifyAnime API.

## Requirements
- Node.js 20+
- A Supabase project
- A private, valid OmnifyAnime API key from its provider

## Local setup
1. Extract the ZIP and open the project folder.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. Set `OMNIFY_API_BASE` and `OMNIFY_API_KEY`. The API key is server-only; never use a `NEXT_PUBLIC_` prefix.
6. Run `supabase/schema.sql` in the Supabase SQL Editor.
7. Configure Supabase Authentication site URL and email redirect URLs.
8. Run `npm run dev`.

## Browser video player
- The Watch page supports authorized HTTPS MP4/WebM sources, HLS (`.m3u8`) through `hls.js`, and approved embed URLs.
- Multiple approved sources are shown as selectable server buttons.
- Playback remains disabled until the content owner confirms distribution rights and configures the exact approved hostnames. This is intentional; an API response alone is not proof of streaming permission.
- Example server environment values (only use domains you own or are licensed to use): `STREAMING_RIGHTS_CONFIRMED=true` and `OMNIFY_ALLOWED_STREAM_HOSTS=media.example.com,cdn.example.com`.
- After adding/changing dependencies, run `npm install`, then `npm run lint` and `npm run build`.

## Validation
- `npm run lint` runs the strict TypeScript compiler (`tsc --noEmit`).
- `npm run build` runs the Next.js production build.

## Deploy to Vercel
Push the project to GitHub, import the repository in Vercel, and add the same environment variables in Project Settings → Environment Variables. Redeploy after changing environment variables.

## Included
- Responsive dark monochrome NIME SPACE interface
- Desktop navigation and mobile navigation
- Home, Explore/search, weekly Schedule, Movies, Donghua, Anime Detail, and gated Watch Player pages
- Supabase email/password registration and login
- Profile page with member ID, role label, level, and rank tier
- Server-side OmnifyAnime API helper and proxy route
- Supabase schema for profiles, borders, banners, bookmarks, and watch history

## Important notes
- The OmnifyAnime API has been described by its provider as a development/unfinished API. Endpoint response shapes and query parameters may change. Verify endpoints with the provider before relying on them in production.
- This project does not include a provider key. Obtain a private key from the API provider and store it only in server environment variables.
- API metadata does not grant permission to redistribute video. The Watch Player is disabled by default. Only enable `STREAMING_RIGHTS_CONFIRMED=true` and set `OMNIFY_ALLOWED_STREAM_HOSTS` after the provider confirms distribution rights for those exact video hosts. The player will reject hosts outside that allowlist.
- The profile trigger creates member profiles and sequential public IDs. Users can update only basic profile/cosmetic columns; role, level, total EXP, and public ID are not user-editable through the normal client role.
- Assign admin/owner roles only through trusted Supabase administration.
- Border/banner asset upload dashboard and EXP award/rank progression are not implemented in this starter. The schema includes asset and ownership tables for the next development phase.
- The rank thresholds are display tiers only. An EXP curve and rank-up rewards have not been configured.
