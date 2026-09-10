# Agente de WhatsApp con IA

Plantilla genérica para construir un agente de atención al cliente por WhatsApp
impulsado por Claude, con panel de administración, agendado de citas
sincronizado con Google Calendar y control humano por conversación.

Pensado como base reutilizable: toda la configuración específica de cada
negocio (nombre, horarios, servicios, persona del bot, mensajes) vive en la
base de datos y se edita desde el panel — el código no cambia entre clientes.

## Stack

- Next.js 16 (App Router, TypeScript) + Tailwind CSS
- Supabase (Postgres + Auth + Realtime)
- Anthropic API (Claude) con tool-calling
- Google Calendar API
- WhatsApp Cloud API (Meta)

## Primeros pasos

Sigue [SETUP.md](./SETUP.md) paso a paso: crea las cuentas necesarias
(Supabase, Anthropic, Google Cloud, Meta for Developers), rellena
`.env.local` y levanta el proyecto en local.

```bash
npm install
npm run dev
```

## Estructura

- `app/` — páginas del panel y rutas de API (webhook, OAuth, etc.)
- `lib/agent/` — orquestación del agente de IA (prompt, tools, disponibilidad)
- `lib/whatsapp/` — cliente de la WhatsApp Cloud API
- `lib/google/` — OAuth y sincronización con Google Calendar
- `lib/db/` — acceso a datos (Supabase)
- `supabase/migrations/` — esquema de la base de datos
- `scripts/gen-encryption-key.mjs` — genera la clave de cifrado de tokens
