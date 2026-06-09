import { cache } from "react";
import { unstable_cache } from "next/cache";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";

export type StoreEntry = { id: string; name: string; role: string };

// unstable_cache: persiste 60s entre requests — evita ir a DB en cada navegación
const fetchStoreData = unstable_cache(
  async (userId: string, savedStoreId: string) => {
    const supabase = createServiceClient();

    const { data: memberships } = await supabase
      .from("store_users")
      .select("store_id, role")
      .eq("user_id", userId);

    if (!memberships || memberships.length === 0) {
      return { stores: [] as StoreEntry[], activeStoreId: "", activeStoreName: "Mi Tienda" };
    }

    const storeIds = memberships.map((m: any) => m.store_id as string);

    const { data: storeRows } = await supabase
      .from("stores")
      .select("id, name")
      .in("id", storeIds);

    const stores: StoreEntry[] = memberships.map((m: any) => {
      const info = storeRows?.find((s: any) => s.id === m.store_id);
      return { id: m.store_id, name: info?.name ?? m.store_id, role: m.role ?? "staff" };
    });

    const active = stores.find(s => s.id === savedStoreId) ?? stores[0];

    return {
      stores,
      activeStoreId:   active?.id   ?? "",
      activeStoreName: active?.name ?? "Mi Tienda",
    };
  },
  ["store-context"],
  { revalidate: 60, tags: ["store-context"] }
);

// React.cache: deduplica dentro de un mismo request (layout + página no doblan la query)
export const getStoreContext = cache(async (userId: string) => {
  const savedStoreId = cookies().get("activeStore")?.value ?? "";
  return fetchStoreData(userId, savedStoreId);
});
