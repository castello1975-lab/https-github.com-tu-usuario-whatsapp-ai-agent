"use server";

import { revalidatePath } from "next/cache";
import { getCurrentOrgId } from "@/lib/auth/currentOrg";
import { createClient } from "@/lib/supabase/server";
import { updateOrganization } from "@/lib/db/organizations";
import { updateAgentSettings } from "@/lib/db/agentSettings";
import { updateBusinessHour } from "@/lib/db/businessHours";
import { createService, updateService, deleteService } from "@/lib/db/services";
import type { Faq } from "@/lib/db/types";

async function requireOrg() {
  const current = await getCurrentOrgId();
  if (!current) throw new Error("No autenticado");
  return current;
}

export async function saveBusinessInfoAction(formData: FormData) {
  const { orgId } = await requireOrg();
  const supabase = await createClient();

  await updateOrganization(supabase, orgId, {
    business_name: String(formData.get("business_name") ?? ""),
    address: String(formData.get("address") ?? ""),
    phone: String(formData.get("phone") ?? ""),
  });

  await updateAgentSettings(supabase, orgId, {
    policies: String(formData.get("policies") ?? ""),
  });

  revalidatePath("/customization");
}

export async function savePersonaAction(formData: FormData) {
  const { orgId } = await requireOrg();
  const supabase = await createClient();

  await updateAgentSettings(supabase, orgId, {
    system_prompt: String(formData.get("system_prompt") ?? ""),
    tone: String(formData.get("tone") ?? ""),
    ask_new_patient: formData.get("ask_new_patient") === "on",
  });

  revalidatePath("/customization");
}

export async function saveMessagesAction(formData: FormData) {
  const { orgId } = await requireOrg();
  const supabase = await createClient();

  await updateAgentSettings(supabase, orgId, {
    greeting_message: String(formData.get("greeting_message") ?? ""),
    handoff_message: String(formData.get("handoff_message") ?? ""),
  });

  revalidatePath("/customization");
}

export async function saveFaqsAction(faqs: Faq[]) {
  const { orgId } = await requireOrg();
  const supabase = await createClient();
  await updateAgentSettings(supabase, orgId, { faqs });
  revalidatePath("/customization");
}

export async function saveBusinessHourAction(
  dayOfWeek: number,
  isOpen: boolean,
  openTime: string,
  closeTime: string
) {
  const { orgId } = await requireOrg();
  const supabase = await createClient();
  await updateBusinessHour(supabase, orgId, dayOfWeek, {
    is_open: isOpen,
    open_time: isOpen ? openTime : null,
    close_time: isOpen ? closeTime : null,
  });
  revalidatePath("/customization");
}

export async function createServiceAction(formData: FormData) {
  const { orgId } = await requireOrg();
  const supabase = await createClient();
  await createService(supabase, orgId, {
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    duration_minutes: Number(formData.get("duration_minutes") ?? 30),
  });
  revalidatePath("/customization");
}

export async function updateServiceAction(serviceId: string, formData: FormData) {
  await requireOrg();
  const supabase = await createClient();
  await updateService(supabase, serviceId, {
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    duration_minutes: Number(formData.get("duration_minutes") ?? 30),
    active: formData.get("active") === "on",
  });
  revalidatePath("/customization");
}

export async function deleteServiceAction(serviceId: string) {
  await requireOrg();
  const supabase = await createClient();
  await deleteService(supabase, serviceId);
  revalidatePath("/customization");
}
