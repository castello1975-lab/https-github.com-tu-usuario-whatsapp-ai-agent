"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createDefaultBusinessHours } from "@/lib/db/businessHours";
import { createDefaultAgentSettings } from "@/lib/db/agentSettings";
import { createClient as createServerClient } from "@/lib/supabase/server";

export interface RegisterState {
  error?: string;
}

export async function registerAction(
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const businessName = String(formData.get("businessName") ?? "").trim();
  const timezone = String(formData.get("timezone") ?? "Europe/Madrid").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!fullName || !businessName || !email || !password) {
    return { error: "Rellena todos los campos." };
  }
  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  const admin = createAdminClient();

  const { data: userData, error: createUserError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (createUserError || !userData.user) {
    return { error: createUserError?.message ?? "No se pudo crear el usuario." };
  }

  const { data: org, error: orgError } = await admin
    .from("organizations")
    .insert({ business_name: businessName, owner_name: fullName, timezone })
    .select("*")
    .single();

  if (orgError || !org) {
    await admin.auth.admin.deleteUser(userData.user.id);
    return { error: orgError?.message ?? "No se pudo crear la organización." };
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: userData.user.id,
    org_id: org.id,
    full_name: fullName,
  });
  if (profileError) {
    return { error: profileError.message };
  }

  await createDefaultBusinessHours(admin, org.id);
  await createDefaultAgentSettings(admin, org.id);

  const supabase = await createServerClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) {
    return { error: signInError.message };
  }

  redirect("/dashboard");
}
