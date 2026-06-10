import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

// PATCH /api/staff/:userId — cambiar rol
export async function PATCH(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { storeId, role } = await req.json();
    const VALID_ROLES = ["owner", "admin", "cajero"];
    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Protección: no degradar al último dueño de la tienda
    if (role !== "owner" && await isLastOwner(supabase, storeId, params.userId)) {
      return NextResponse.json({ error: "No puedes degradar al último dueño de la tienda" }, { status: 400 });
    }

    const { error } = await supabase
      .from("store_users")
      .update({ role })
      .eq("store_id", storeId)
      .eq("user_id", params.userId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/staff/:userId — remover del equipo
export async function DELETE(req: NextRequest, { params }: { params: { userId: string } }) {
  const storeId = req.nextUrl.searchParams.get("storeId");
  if (!storeId) return NextResponse.json({ error: "storeId requerido" }, { status: 400 });

  const supabase = createServiceClient();

  // Protección: no eliminar al último dueño de la tienda
  if (await isLastOwner(supabase, storeId, params.userId)) {
    return NextResponse.json({ error: "No puedes eliminar al último dueño de la tienda" }, { status: 400 });
  }

  const { error } = await supabase
    .from("store_users")
    .delete()
    .eq("store_id", storeId)
    .eq("user_id", params.userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// ¿Este usuario es el único dueño que le queda a la tienda?
async function isLastOwner(
  supabase: ReturnType<typeof createServiceClient>,
  storeId: string,
  userId: string,
): Promise<boolean> {
  const { data: target } = await supabase
    .from("store_users")
    .select("role")
    .eq("store_id", storeId)
    .eq("user_id", userId)
    .single();

  if (target?.role !== "owner") return false;

  const { count } = await supabase
    .from("store_users")
    .select("user_id", { count: "exact", head: true })
    .eq("store_id", storeId)
    .eq("role", "owner");

  return (count ?? 0) <= 1;
}
