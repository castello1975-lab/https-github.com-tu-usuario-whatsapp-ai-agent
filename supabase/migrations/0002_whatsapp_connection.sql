-- Conversión a multi-tenant: conexión de WhatsApp por organización.
-- Ejecutar completo en Supabase > SQL Editor. Aditivo, no toca 0001_init.sql.

create table whatsapp_connection (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null unique references organizations (id) on delete cascade,
  phone_number_id text not null unique,
  business_account_id text,
  access_token_encrypted text not null,
  app_secret_encrypted text not null,
  verify_token text not null,
  connected_at timestamptz,
  updated_at timestamptz not null default now()
);

create index whatsapp_connection_verify_token_idx on whatsapp_connection (verify_token);

alter table whatsapp_connection enable row level security;

create policy "whatsapp_connection: org members" on whatsapp_connection
  for all
  using (org_id = (select org_id from profiles where id = auth.uid()))
  with check (org_id = (select org_id from profiles where id = auth.uid()));
