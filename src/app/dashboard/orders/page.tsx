import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getStoreContext } from "@/lib/store-context";
import OrdersBoard from "@/components/orders/OrdersBoard";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { activeStoreId } = await getStoreContext(user.id);

  // Carga inicial server-side con service role (bypasa RLS)
  const admin = createServiceClient();
  const { data: orders } = await admin
    .from("orders")
    .select("*")
    .eq("store_id", activeStoreId)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="flex flex-col h-screen">
      <div className="px-6 py-5 border-b border-gray-200 bg-white">
        <h1 className="text-xl font-bold text-gray-900">Pedidos</h1>
        <p className="text-sm text-gray-500 mt-0.5">Los nuevos pedidos aparecen en tiempo real</p>
      </div>
      <div className="flex-1 overflow-hidden">
        <OrdersBoard storeId={activeStoreId} initialOrders={(orders ?? []) as Order[]} />
      </div>
    </div>
  );
}
