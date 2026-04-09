# Supabase Migration Guide

The backend now runs in Supabase-only mode.

## 1) Create Supabase project

1. Create a new project in Supabase.
2. In Project Settings -> API, copy:
- Project URL
- Anon key
- Service role key

## 1.1) Supabase dashboard checklist

In Supabase.com, run these actions in order:

1. Open SQL Editor -> New query.
2. Paste and run `backend/sql/supabase_schema.sql`.
3. Go to Table Editor and confirm tables exist:
- `users`
- `posts`
- `comments`
- `post_likes`
- `comment_reactions`
4. Go to Authentication -> Providers:
- Keep Email enabled only if you plan to use Supabase Auth later.
- For now, app auth still uses your existing JWT flow.
5. Go to Database -> Extensions and verify `pgcrypto` is enabled.
6. Go to SQL Editor and run this quick smoke query:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;
```

7. Optional hardening step for now:
- Keep RLS off for these tables while backend uses service role key only.
- Never expose service role key in frontend.

## 2) Configure backend environment

In `backend/.env`, set:

- `DB_PROVIDER=supabase`
- `SUPABASE_URL=...`
- `SUPABASE_ANON_KEY=...`
- `SUPABASE_SERVICE_ROLE_KEY=...`
- `JWT_SECRET=...`

## 3) Apply database schema

Run `backend/sql/supabase_schema.sql` in Supabase SQL Editor.

## 4) Start backend

1. Install deps: `npm install`
2. Start API: `npm run dev`
3. Check health: `GET /health`
4. Test one auth call and one post call:
- `POST /api/auth/register`
- `GET /api/posts`

Expected response in Supabase mode:

```json
{
  "status": "ok",
  "dbProvider": "supabase",
  "database": "connected"
}
```

## 5) Migration status

Completed:

1. Auth controller and auth middleware migrated to Supabase
2. Posts controller migrated (read/write/search/drafts/likes)
3. Comments controller migrated (read/write/delete/reactions)
4. User profile controller migrated (read/update)
5. Helper scripts in `backend/scripts` migrated to Supabase
6. Mongoose dependency removed from backend runtime dependencies

## 6) Auth strategy

Recommended now:

- Keep existing JWT flow for quick migration.
- Replace `User.findById(...)` in auth middleware with Supabase query by UUID.

Optional later:

- Move to Supabase Auth after data layer is stable.

## 7) Kafka integration notes

For event streaming, use Postgres + Kafka outbox pattern:

1. Write domain change + outbox row in the same transaction.
2. Publish outbox rows to Kafka with a worker.
3. Mark outbox rows processed.

This gives reliable event delivery and avoids dual-write inconsistencies.

## 8) Final validation steps

1. Run regression tests for auth, posts, comments, profile edits.
2. Backfill data from MongoDB to Supabase in dependency order:
- users
- posts
- comments
- post_likes
- comment_reactions
3. Keep Kafka integration using outbox pattern on Postgres side.
