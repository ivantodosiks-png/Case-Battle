-- Postgres (Supabase) schema for Case-Battle drops

create table if not exists skins (
  id text primary key,
  name text not null,
  image text not null,
  rarity text not null,
  wear text not null,
  price numeric(12,2) not null,
  gradient_from text not null,
  gradient_to text not null,
  created_at timestamptz not null default now()
);

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
alter table skins enable row level security;
alter table user_drops enable row level security;

-- Public read access for the skin catalog (anon/auth)
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'skins' and policyname = 'skins_select_public'
  ) then
    create policy skins_select_public on skins for select using (true);
  end if;
end $$;

-- Insert existing catalog (safe to re-run)
insert into skins (id, name, image, rarity, wear, price, gradient_from, gradient_to) values
('ak47-neon-rebellion','AK-47 | Neon Rebellion','demo','classified','Field-Tested',112.00,'#ec4899','#db2777'),
('awp-ether-dream','AWP | Ether Dream','demo','covert','Minimal Wear',380.00,'#f97316','#ef4444'),
('m4a1s-pulse-night','M4A1-S | Pulse Night','demo','restricted','Factory New',64.00,'#a855f7','#7c3aed'),
('deagle-constellation','Desert Eagle | Constellation','demo','milspec','Minimal Wear',18.00,'#3b82f6','#1d4ed8'),
('glock-noir','Glock-18 | Noir','demo','industrial','Field-Tested',9.00,'#60a5fa','#2563eb'),
('usp-silence-shards','USP-S | Silence Shards','demo','restricted','Well-Worn',42.00,'#a855f7','#7c3aed'),
('karambit-solar-flare','★ Karambit | Solar Flare','demo','knife','Factory New',1450.00,'#fbbf24','#f97316'),
('gloves-violet-weave','★ Sport Gloves | Violet Weave','demo','knife','Minimal Wear',980.00,'#fbbf24','#f97316'),
('p250-microburst','P250 | Microburst','demo','consumer','Factory New',1.65,'#9ca3af','#6b7280'),
('m4a4-neo-temple','M4A4 | Neo Temple','demo','classified','Minimal Wear',220.00,'#ec4899','#db2777'),
('knife-butterfly-aurora','★ Butterfly Knife | Aurora','demo','knife','Field-Tested',2100.00,'#fbbf24','#f97316'),
('sg553-hypnotic-grid','SG 553 | Hypnotic Grid','demo','restricted','Factory New',78.00,'#a855f7','#7c3aed'),
('mp9-velvet-hex','MP9 | Velvet Hex','demo','milspec','Well-Worn',12.00,'#3b82f6','#1d4ed8'),
('galil-echo-strike','Galil AR | Echo Strike','demo','industrial','Field-Tested',6.50,'#60a5fa','#2563eb')
on conflict (id) do nothing;

-- Allow insert only via service role (no policy needed for anon/auth in this demo).
-- If you later add auth, create policies per-user.
