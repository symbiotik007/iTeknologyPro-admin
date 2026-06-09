import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getStoreContext } from "@/lib/store-context";
import MenuManager from "@/components/menu/MenuManager";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { activeStoreId } = await getStoreContext(user.id);
  const admin = createServiceClient();

  const [{ data: products }, { data: categories }] = await Promise.all([
    admin.from("products").select("*").eq("store_id", activeStoreId).order("sort_order"),
    admin.from("categories").select("*").eq("store_id", activeStoreId).order("sort_order"),
  ]);

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Menú</h1>
        <p className="text-sm text-gray-500 mt-1">Gestiona productos y categorías de <span className="font-semibold">{activeStoreId}</span></p>
      </div>
      <MenuManager
        storeId={activeStoreId}
        initialProducts={products ?? []}
        initialCategories={categories ?? []}
      />
    </div>
  );
}
