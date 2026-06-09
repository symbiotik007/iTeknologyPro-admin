import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getStoreContext } from "@/lib/store-context";
import StoreSettings from "@/components/settings/StoreSettings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { activeStoreId, stores } = await getStoreContext(user.id);
  const userRole = stores.find(s => s.id === activeStoreId)?.role ?? "staff";

  const admin = createServiceClient();
  const { data: store } = await admin
    .from("stores").select("*").eq("id", activeStoreId).single();

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-sm text-gray-500 mt-1">Datos y configuración de <span className="font-semibold">{activeStoreId}</span></p>
      </div>
      <StoreSettings store={store} storeId={activeStoreId} userRole={userRole} />
    </div>
  );
}
