-- ============================================================
-- Triskope CRM — Phase A database schema
-- ============================================================
-- Paste this entire file into the Supabase SQL Editor:
--   Project → SQL Editor → New query → paste → Run
--
-- Idempotent: safe to re-run. Uses CREATE ... IF NOT EXISTS
-- and CREATE OR REPLACE wherever possible. Drop and re-run if
-- you want a clean slate (see "RESET" section at the bottom,
-- commented out for safety).
-- ============================================================


-- ------------------------------------------------------------
-- 0. Extensions
-- ------------------------------------------------------------
create extension if not exists "pgcrypto";   -- gen_random_uuid()


-- ============================================================
-- 1. PROFILES — 1:1 with auth.users
-- ============================================================
-- Every authenticated user gets a profile row. Role drives
-- whether they see the admin panel or just their own data.
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  display_name text,
  role         text not null default 'agent' check (role in ('admin','agent','visitor')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ============================================================
-- 2. AGENTS — subscriber agents (paid customers)
-- ============================================================
-- An agent may exist without a linked profile_id (pre-seeded
-- demo agent). When a real user signs up, an admin can link
-- their profile_id to an existing agent slot or create a new one.
create table if not exists public.agents (
  id                     uuid primary key default gen_random_uuid(),
  profile_id             uuid unique references public.profiles(id) on delete set null,
  full_name              text not null,
  subdomain              text unique,                -- sarahmitchell
  plan                   text not null default 'starter' check (plan in ('starter','pro','enterprise')),
  access_status          text not null default 'active' check (access_status in ('active','past_due','suspended','canceled')),
  stripe_customer_id     text,
  stripe_subscription_id text,
  headshot_url           text,
  bio                    text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists agents_profile_idx on public.agents(profile_id);
create index if not exists agents_plan_idx    on public.agents(plan);
create index if not exists agents_status_idx  on public.agents(access_status);


-- ============================================================
-- 3. LEADS
-- ============================================================
create table if not exists public.leads (
  id          uuid primary key default gen_random_uuid(),
  agent_id    uuid references public.agents(id) on delete set null,
  name        text not null,
  email       text,
  phone       text,
  source      text,
  status      text not null default 'new' check (status in ('new','nurture','hot','cold','closed')),
  stage       text not null default 'new' check (stage in ('new','contacted','qualified','showing','offer','closed')),
  score       int  not null default 0 check (score between 0 and 100),
  area        text,
  budget      text,
  interest    text,
  ai_notes    text,
  utm_source  text,
  utm_medium  text,
  utm_campaign text,
  added_days  int not null default 0,
  last_contact text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists leads_agent_idx  on public.leads(agent_id);
create index if not exists leads_status_idx on public.leads(status);
create index if not exists leads_stage_idx  on public.leads(stage);
create index if not exists leads_score_idx  on public.leads(score desc);


-- ============================================================
-- 4. LEAD_TAGS, LEAD_ACTIVITY, LEAD_NOTES, LEAD_TASKS
-- ============================================================
create table if not exists public.lead_tags (
  lead_id uuid not null references public.leads(id) on delete cascade,
  tag     text not null,
  primary key (lead_id, tag)
);

create table if not exists public.lead_activity (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references public.leads(id) on delete cascade,
  type        text not null,   -- view | email | call | form | showing | system
  text        text not null,
  icon        text,             -- maps to lucide icon in UI
  occurred_at timestamptz not null default now()
);
create index if not exists lead_activity_lead_idx on public.lead_activity(lead_id, occurred_at desc);

create table if not exists public.lead_notes (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid not null references public.leads(id) on delete cascade,
  agent_id   uuid references public.agents(id) on delete set null,
  text       text not null,
  created_at timestamptz not null default now()
);
create index if not exists lead_notes_lead_idx on public.lead_notes(lead_id, created_at desc);

create table if not exists public.lead_tasks (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid not null references public.leads(id) on delete cascade,
  agent_id   uuid references public.agents(id) on delete set null,
  text       text not null,
  due_date   date,
  done       boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists lead_tasks_lead_idx on public.lead_tasks(lead_id);
create index if not exists lead_tasks_due_idx  on public.lead_tasks(due_date) where not done;


-- ============================================================
-- 5. COMMUNITIES + per-agent COMMUNITY_PAGES
-- ============================================================
create table if not exists public.communities (
  id        uuid primary key default gen_random_uuid(),
  slug      text not null unique,
  name      text not null,
  area      text,
  type      text,
  icon      text,
  created_at timestamptz not null default now()
);

create table if not exists public.agent_communities (
  agent_id     uuid not null references public.agents(id) on delete cascade,
  community_id uuid not null references public.communities(id) on delete cascade,
  primary key (agent_id, community_id)
);

create table if not exists public.community_pages (
  id           uuid primary key default gen_random_uuid(),
  agent_id     uuid not null references public.agents(id) on delete cascade,
  community_id uuid not null references public.communities(id) on delete cascade,
  custom_content jsonb default '{}'::jsonb,
  views        int not null default 0,
  leads_count  int not null default 0,
  unique (agent_id, community_id)
);


-- ============================================================
-- 6. LISTINGS + saved_listings
-- ============================================================
create table if not exists public.listings (
  id            uuid primary key default gen_random_uuid(),
  mls_id        text unique,
  address       text not null,
  community_id  uuid references public.communities(id) on delete set null,
  area          text,
  price         numeric not null,
  beds          numeric not null,
  baths         numeric not null,
  sqft          int    not null,
  type          text   not null check (type in ('Single Family','Condo','Townhouse','Land','Multi-Family')),
  status        text   not null default 'active' check (status in ('active','pending','sold','withdrawn')),
  lat           numeric,
  lng           numeric,
  listing_agent uuid references public.agents(id) on delete set null,
  days_on_market int not null default 0,
  photo         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists listings_area_idx on public.listings(area);
create index if not exists listings_status_idx on public.listings(status);
create index if not exists listings_agent_idx on public.listings(listing_agent);

create table if not exists public.saved_listings (
  agent_id   uuid not null references public.agents(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  saved_at   timestamptz not null default now(),
  primary key (agent_id, listing_id)
);
