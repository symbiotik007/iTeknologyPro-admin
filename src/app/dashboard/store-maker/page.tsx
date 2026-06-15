import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StoreMakerWizard from "@/components/store-maker/StoreMakerWizard";
import { STORE_URL } from "@/lib/storeUrl";

export const metadata = { title: "Store Maker" };

export default async function StoreMakerPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <StoreMakerWizard storeUrl={STORE_URL} />;
}
