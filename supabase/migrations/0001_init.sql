-- WhatsApp AI Agent — esquema inicial
-- Ejecutar completo en Supabase > SQL Editor.

create extension if not exists "pgcrypto";

-- ORGANIZATIONS ---------------------------------------------------------
create table organizations (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  owner_name text,
  timezone text not null default 'Europe/Madrid',
  address text,
  phone text,
  created_at timestamptz not null default now()
);

-- PROFILES ---------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  org_id uuid references organizations (id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

-- BUSINESS HOURS -----------------------------------------------------------
create table business_hours (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6), -- 0 = domingo
  is_open boolean not null default true,
  open_time time,
  close_time time,
  unique (org_id, day_of_week)
);

-- SERVICES -----------------------------------------------------------------
create table services (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  name text not null,
  description text,
  duration_minutes int not null check (duration_minutes > 0),
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- AGENT SETTINGS -------------------------------------------------------------
create table agent_settings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null unique references organizations (id) on delete cascade,
  system_prompt text not null default '',
  tone text,
  ask_new_patient boolean not null default true,
  greeting_message text not null default '¡Hola! ¿En qué puedo ayudarte hoy?',
  handoff_message text not null default 'Ahora mismo te va a atender una persona de nuestro equipo.',
  faqs jsonb not null default '[]'::jsonb,
  policies text,
  updated_at timestamptz not null default now()
);

-- CONTACTS -------------------------------------------------------------------
create table contacts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  whatsapp_phone text not null,
  display_name text,
  created_at timestamptz not null default now(),
  unique (org_id, whatsapp_phone)
);

-- CONVERSATIONS ----------------------------------------------------------------
create table conversations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  contact_id uuid not null references contacts (id) on delete cascade,
  bot_enabled boolean not null default true,
  status text not null default 'open', -- open | handoff | closed
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- MESSAGES -----------------------------------------------------------------------
create table messages (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  conversation_id uuid not null references conversations (id) on delete cascade,
  direction text not null,   -- inbound | outbound
  sender_type text not null, -- contact | bot | staff
  content text not null,
  whatsapp_message_id text,
  status text not null default 'sent', -- sent | delivered | read | failed
  created_at timestamptz not null default now()
);

-- APPOINTMENTS --------------------------------------------------------------------
create table appointments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  conversation_id uuid references conversations (id) on delete set null,
  contact_id uuid references contacts (id) on delete set null,
  service_id uuid references services (id) on delete set null,
  customer_name text not null,
  is_new_patient boolean,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'booked', -- booked | cancelled | completed | no_show
  google_event_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- GOOGLE CALENDAR CONNECTION ---------------------------------------------------------
create table google_calendar_connection (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null unique references organizations (id) on delete cascade,
  google_account_email text,
  calendar_id text,
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expiry timestamptz,
  scope text,
  connected_at timestamptz,
  updated_at timestamptz not null default now()
);

-- CONVERSATION EVENTS (audit log) ----------------------------------------------------
create table conversation_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  conversation_id uuid not null references conversations (id) on delete cascade,
  event_type text not null, -- bot_disabled | bot_enabled | handoff_triggered
  meta jsonb,
  created_at timestamptz not null default now()
);

-- INDEXES ------------------------------------------------------------------------------
create index messages_conversation_created_idx on messages (conversation_id, created_at);
create index appointments_org_starts_idx on appointments (org_id, starts_at);
create index conversations_org_last_message_idx on conversations (org_id, last_message_at desc);

-- REALTIME -----------------------------------------------------------------------------
alter publication supabase_realtime add table messages, conversations;

-- ROW LEVEL SECURITY --------------------------------------------------------------------
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table business_hours enable row level security;
alter table services enable row level security;
alter table agent_settings enable row level security;
alter table contacts enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table appointments enable row level security;
alter table google_calendar_connection enable row level security;
alter table conversation_events enable row level security;

create policy "profiles: self access" on profiles
  for all
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "organizations: org members" on organizations
  for all
  using (id = (select org_id from profiles where id = auth.uid()))
  with check (id = (select org_id from profiles where id = auth.uid()));

create policy "business_hours: org members" on business_hours
  for all
  using (org_id = (select org_id from profiles where id = auth.uid()))
  with check (org_id = (select org_id from profiles where id = auth.uid()));

create policy "services: org members" on services
  for all
  using (org_id = (select org_id from profiles where id = auth.uid()))
  with check (org_id = (select org_id from profiles where id = auth.uid()));

create policy "agent_settings: org members" on agent_settings
  for all
  using (org_id = (select org_id from profiles where id = auth.uid()))
  with check (org_id = (select org_id from profiles where id = auth.uid()));

create policy "contacts: org members" on contacts
  for all
  using (org_id = (select org_id from profiles where id = auth.uid()))
  with check (org_id = (select org_id from profiles where id = auth.uid()));

create policy "conversations: org members" on conversations
  for all
  using (org_id = (select org_id from profiles where id = auth.uid()))
  with check (org_id = (select org_id from profiles where id = auth.uid()));

create policy "messages: org members" on messages
  for all
  using (org_id = (select org_id from profiles where id = auth.uid()))
  with check (org_id = (select org_id from profiles where id = auth.uid()));

create policy "appointments: org members" on appointments
  for all
  using (org_id = (select org_id from profiles where id = auth.uid()))
  with check (org_id = (select org_id from profiles where id = auth.uid()));

create policy "google_calendar_connection: org members" on google_calendar_connection
  for all
  using (org_id = (select org_id from profiles where id = auth.uid()))
  with check (org_id = (select org_id from profiles where id = auth.uid()));

create policy "conversation_events: org members" on conversation_events
  for all
  using (org_id = (select org_id from profiles where id = auth.uid()))
  with check (org_id = (select org_id from profiles where id = auth.uid()));
