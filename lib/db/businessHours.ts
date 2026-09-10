import type { SupabaseClient } from "@supabase/supabase-js";
import type { BusinessHour } from "./types";

export async function getBusinessHours(
  supabase: SupabaseClient,
  orgId: string
): Promise<BusinessHour[]> {
  const { data, error } = await supabase
    .from("business_hours")
    .select("*")
    .eq("org_id", orgId)
    .order("day_of_week", { ascending: true });
  if (error) throw error;
  return (data ?? []) as BusinessHour[];
}

export async function createDefaultBusinessHours(
  supabase: SupabaseClient,
  orgId: string
): Promise<void> {
  const rows = Array.from({ length: 7 }, (_, day_of_week) => ({
    org_id: orgId,
    day_of_week,
    is_open: day_of_week >= 1 && day_of_week <= 5,
    open_time: "09:00:00",
    close_time: "18:00:00",
  }));
  const { error } = await supabase.from("business_hours").insert(rows);
  if (error) throw error;
}

export async function updateBusinessHour(
  supabase: SupabaseClient,
  orgId: string,
  dayOfWeek: number,
  patch: Partial<Pick<BusinessHour, "is_open" | "open_time" | "close_time">>
): Promise<void> {
  const { error } = await supabase
    .from("business_hours")
    .update(patch)
    .eq("org_id", orgId)
    .eq("day_of_week", dayOfWeek);
  if (error) throw error;
}
