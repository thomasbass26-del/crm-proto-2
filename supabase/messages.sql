-- ============================================================
-- Messages table — adds two-way agent ↔ lead communication
-- ============================================================
-- Paste into Supabase SQL Editor and run once.
--
-- For now, message bodies persist to the database only. To make
-- the CRM actually send email or SMS to leads, we'd wire send
-- requests through Resend (email) or Twilio (SMS) via a Supabase
-- Edge Function. Incoming replies would come back via a Resend
-- inbound webhook or a Twilio webhook that inserts into this table
-- with direction = 'inbound'.
-- ============================================================

create table if not exists public.messages (
  id           uuid primary key default gen_random_uuid(),
  lead_id      uuid not null references public.leads(id) on delete cascade,
  agent_id     uuid references public.agents(id) on delete set null,
  direction    text not null check (direction in ('outbound', 'inbound')),
  channel      text not null check (channel in ('email', 'sms', 'note')),
  subject      text,
  body         text not null,
  sent_at      timestamptz not null default now(),
  read_at      timestamptz,
  external_id  text,   -- e.g., Resend / Twilio message id
  created_at   timestamptz not null default now()
);
create index if not exists messages_lead_idx on public.messages(lead_id, sent_at desc);

alter table public.messages enable row level security;
drop policy if exists "messages_access" on public.messages;

-- Demo mode policy (matches the leads demo policy): any authenticated
-- user can read/write any message. Tighten before real launch — the
-- correct production policy is "agent can only see messages on leads
-- they own; admin can see all".
create policy "messages_access" on public.messages
  for all
  using  (auth.uid() is not null)
  with check (auth.uid() is not null);
