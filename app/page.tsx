import { redirect } from "next/navigation";
import { getCurrentOrgId } from "@/lib/auth/currentOrg";

export default async function RootPage() {
  const current = await getCurrentOrgId();
  redirect(current ? "/dashboard" : "/login");
}
