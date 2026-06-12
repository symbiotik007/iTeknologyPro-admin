import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const storeId = req.nextUrl.searchParams.get("storeId");
  if (!storeId) return NextResponse.json({ error: "storeId requerido" }, { status: 400 });

  const supabase = createServiceClient();

  const { data: customers, error } = await supabase
    .from("customers")
    .select("user_id, name, phone, cedula, created_at")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enriquecer con email desde auth.users
  const { data: { users } } = await supabase.auth.admin.listUsers();

  const enriched = (customers ?? []).map((c: any) => {
    const u = users?.find(u => u.id === c.user_id);
    return {
      userId:    c.user_id,
      name:      c.name ?? "—",
      phone:     c.phone ?? "—",
      cedula:    c.cedula ?? "—",
      email:     u?.email ?? "—",
      createdAt: c.created_at,
    };
  });

  return NextResponse.json(enriched);
}
