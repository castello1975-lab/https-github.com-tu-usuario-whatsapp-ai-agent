import type { SupabaseClient } from "@supabase/supabase-js";
import type { Appointment } from "./types";

export async function listAppointmentsInRange(
  supabase: SupabaseClient,
  orgId: string,
  fromIso: string,
  toIso: string
): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("org_id", orgId)
    .neq("status", "cancelled")
    .gte("starts_at", fromIso)
    .lte("starts_at", toIso)
    .order("starts_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Appointment[];
}

export async function listUpcomingAppointmentsForContact(
  supabase: SupabaseClient,
  orgId: string,
  contactId: string
): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("org_id", orgId)
    .eq("contact_id", contactId)
    .eq("status", "booked")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Appointment[];
}

export async function createAppointment(
  supabase: SupabaseClient,
  input: {
    orgId: string;
    conversationId: string | null;
    contactId: string | null;
    serviceId: string;
    customerName: string;
    isNewPatient: boolean | null;
    startsAt: string;
    endsAt: string;
    googleEventId?: string | null;
  }
): Promise<Appointment> {
  const { data, error } = await supabase
    .from("appointments")
    .insert({
      org_id: input.orgId,
      conversation_id: input.conversationId,
      contact_id: input.contactId,
      service_id: input.serviceId,
      customer_name: input.customerName,
      is_new_patient: input.isNewPatient,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      google_event_id: input.googleEventId ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Appointment;
}

export async function updateAppointment(
  supabase: SupabaseClient,
  appointmentId: string,
  patch: Partial<
    Pick<Appointment, "starts_at" | "ends_at" | "status" | "google_event_id">
  >
): Promise<void> {
  const { error } = await supabase
    .from("appointments")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", appointmentId);
  if (error) throw error;
}
