"use server";

import { revalidatePath } from "next/cache";
import { getCurrentOrgId } from "@/lib/auth/currentOrg";
import { createClient } from "@/lib/supabase/server";
import { disconnectGoogle } from "@/lib/db/googleConnection";

export async function disconnectGoogleAction() {
  const current = await getCurrentOrgId();
  if (!current) throw new Error("No autenticado");
  const supabase = await createClient();
  await disconnectGoogle(supabase, current.orgId);
  revalidatePath("/integrations");
}
