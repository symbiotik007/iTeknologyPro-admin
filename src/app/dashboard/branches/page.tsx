import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getStoreContext } from "@/lib/store-context";
import BranchManager from "@/components/branches/BranchManager";
import type { Branch } from "@/components/branches/BranchManager";

export const dynamic = "force-dynamic";

export default async function BranchesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { activeStoreId } = await getStoreContext(user.id);
  const admin = createServiceClient();

  const { data: branches } = await admin
    .from("branches")
    .select("*")
    .eq("store_id", activeStoreId)
    .order("sort_order");

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sucursales</h1>
        <p className="text-sm text-gray-500 mt-1">Sedes de <span className="font-semibold">{activeStoreId}</span></p>
      </div>
      <BranchManager
        storeId={activeStoreId}
        initialBranches={(branches ?? []) as Branch[]}
      />
    </div>
  );
}
