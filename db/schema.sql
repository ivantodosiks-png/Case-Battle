-- Postgres (Supabase) schema for Case-Battle drops

create table if not exists user_drops (
  id bigserial primary key,
  user_id uuid not null,
  seed text not null,
  stake_value numeric(12,2) not null,
  target_skin_id text not null,
  chance_pct numeric(6,2) not null,
  roll numeric(6,2) not null,
  reward_skin_id text not null,
  created_at timestamptz not null default now()
);

create index if not exists user_drops_user_id_created_at_idx on user_drops (user_id, created_at desc);

-- Optional: enable RLS + lock down reads (service role can still write)
alter table user_drops enable row level security;

-- Allow insert only via service role (no policy needed for anon/auth in this demo).
-- If you later add auth, create policies per-user.
