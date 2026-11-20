# Nime Space Premium & Community Features

## Setup database
Run `supabase/premium_comments.sql` in the Supabase SQL Editor **after** the existing `supabase/schema.sql` migrations.

This migration adds:
- `profiles.premium_expires_at` for timed Premium membership.
- Episode-specific comments with public read and authenticated posting.
- Premium giveaways with a per-giveaway, one-claim-per-user limit.
- Atomic `claim_premium_giveaway()` RPC so concurrent claims cannot exceed the giveaway quota.

## Premium behavior
- `admin` and `owner` roles are Premium Unlimited.
- Normal Premium users get an expiry timestamp and see remaining whole days.
- A giveaway can award 1, 3, 7, or 30 days per claimant.
- The admin/owner chooses the number of claimant slots (default 10).
- Each claim adds its duration to the later of now or the member's current expiry. Existing active Premium time is not lost.
- Giveaway quota consumption is calculated as `duration_days * max_claims`: 1 day × 10 users = 10 total Premium-days; 3 × 10 = 30; 7 × 10 = 70; 30 × 10 = 300.
- The claim limit is once per user **for each giveaway**. A user can still claim a different giveaway.

## UI
- Home page shows membership status or the text `Coba Premium mulai dari Rp12.000/bulan`.
- Profile page shows the Premium center and admin/owner giveaway creator.
- Episode watch pages include a comment thread for the exact episode.
- No checkout, payment, or purchase flow has been added.

## Security
- Roles are still controlled by trusted database/admin tooling; users cannot grant themselves Premium.
- Giveaway creation is protected by RLS and requires `admin` or `owner`.
- Claiming is performed by a database function using the signed-in Supabase user ID. Do not trust client-supplied user IDs for claims.
- Run the SQL migration before deploying the UI, otherwise the new profile column and tables will not exist.
