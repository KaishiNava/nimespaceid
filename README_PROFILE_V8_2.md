# Nime Space Profile Studio v8.2 hotfix

## Fixes
- Profile avatar now falls back to OAuth user metadata (`avatar_url`, `picture`, or `photo_url`) when `profiles.avatar_url` is empty. If the account has no OAuth photo and no saved `avatar_url`, upload the desired picture once from Edit Profile and press Save changes.
- Banner/border upload no longer sends the whole file in the incoming Vercel Function request. Browser uploads to the user's own `profile-assets/<user-id>/github-staging/` folder, then sends only the staging path to the authenticated admin API route. The route fetches the staged file and sends it to GitHub.
- This avoids the Vercel Functions 4.5 MB incoming request-body limit that caused HTTP 413.
- Staging files are deleted after the API route finishes (best effort).

## Required action
1. Deploy this source to Vercel.
2. In Supabase SQL Editor, rerun `supabase/profile_studio_fix.sql` so `profile-assets` allows up to 10 MB per file.
3. Confirm `GITHUB_TOKEN`, `GITHUB_ASSETS_OWNER=KaishiNava`, `GITHUB_ASSETS_REPO=nime-space-assets`, and `GITHUB_ASSETS_BRANCH=main` are set in Vercel. The token must have Contents: Read and write for that repository.
4. Redeploy after changing Environment Variables.

No GitHub token or Supabase service-role key is placed in browser code.
