import type { SupabaseClient } from "@supabase/supabase-js";
import type { Service } from "./types";

export async function listServices(
  supabase: SupabaseClient,
  orgId: string,
  onlyActive = false
): Promise<Service[]> {
  let query = supabase
    .from("services")
    .select("*")
    .eq("org_id", orgId)
    .order("sort_order", { ascending: true });
  if (onlyActive) query = query.eq("active", true);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Service[];
}

export async function createService(
  supabase: SupabaseClient,
  orgId: string,
  input: Pick<Service, "name" | "description" | "duration_minutes"> &
    Partial<Pick<Service, "sort_order">>
): Promise<Service> {
  const { data, error } = await supabase
    .from("services")
    .insert({ org_id: orgId, ...input })
    .select("*")
    .single();
  if (error) throw error;
  return data as Service;
}

export async function updateService(
  supabase: SupabaseClient,
  serviceId: string,
  patch: Partial<
    Pick<Service, "name" | "description" | "duration_minutes" | "active" | "sort_order">
  >
): Promise<void> {
  const { error } = await supabase
    .from("services")
    .update(patch)
    .eq("id", serviceId);
  if (error) throw error;
}

export async function deleteService(
  supabase: SupabaseClient,
  serviceId: string
): Promise<void> {
  const { error } = await supabase.from("services").delete().eq("id", serviceId);
  if (error) throw error;
}

export async function findServiceByName(
  supabase: SupabaseClient,
  orgId: string,
  name: string
): Promise<Service | null> {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("org_id", orgId)
    .eq("active", true)
    .ilike("name", name)
    .maybeSingle();
  if (error) return null;
  return data as Service | null;
}
