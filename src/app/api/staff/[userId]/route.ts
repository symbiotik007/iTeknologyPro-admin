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
  const { error } = await supabase
    .from("store_users")
    .delete()
    .eq("store_id", storeId)
    .eq("user_id", params.userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
