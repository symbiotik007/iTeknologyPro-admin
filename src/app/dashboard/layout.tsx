import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStoreContext } from "@/lib/store-context";
import Sidebar from "@/components/layout/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { stores, activeStoreId } = await getStoreContext(user.id);

  return (
    <div className="flex min-h-screen">
      <Sidebar stores={stores} activeStoreId={activeStoreId} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
