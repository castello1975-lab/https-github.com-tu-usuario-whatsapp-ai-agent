import "server-only";
import { createClient } from "@/lib/supabase/server";

// Devuelve el usuario logueado y su org_id (o null si no hay sesión / perfil).
export async function getCurrentOrgId(): Promise<{
  userId: string;
  orgId: string;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!profile?.org_id) return null;
  return { userId: user.id, orgId: profile.org_id };
}
