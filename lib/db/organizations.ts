import type { SupabaseClient } from "@supabase/supabase-js";
import type { Organization } from "./types";

export async function getOrganization(
  supabase: SupabaseClient,
  orgId: string
): Promise<Organization | null> {
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", orgId)
    .single();
  if (error) return null;
  return data as Organization;
}

export async function updateOrganization(
  supabase: SupabaseClient,
  orgId: string,
  patch: Partial<Pick<Organization, "business_name" | "owner_name" | "timezone" | "address" | "phone">>
): Promise<void> {
  const { error } = await supabase
    .from("organizations")
    .update(patch)
    .eq("id", orgId);
  if (error) throw error;
}
