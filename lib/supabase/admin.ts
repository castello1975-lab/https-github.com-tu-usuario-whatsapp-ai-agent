import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cliente con service-role key: se salta RLS. Solo para código server-side
// de confianza (webhook, orquestador del agente, bootstrap de registro,
// sync de Google Calendar). Nunca importar desde un componente cliente.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
