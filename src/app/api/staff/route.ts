import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

// GET /api/staff?storeId=X — lista el equipo de una tienda
export async function GET(req: NextRequest) {
  const storeId = req.nextUrl.searchParams.get("storeId");
  if (!storeId) return NextResponse.json({ error: "storeId requerido" }, { status: 400 });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("store_users")
    .select("user_id, role, created_at")
    .eq("store_id", storeId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enriquecer con emails desde auth.users
  const userIds = (data ?? []).map((r: any) => r.user_id);
  const { data: { users }, error: usersErr } = await supabase.auth.admin.listUsers();

  const members = (data ?? []).map((r: any) => {
    const user = users?.find((u) => u.id === r.user_id);
    return { userId: r.user_id, role: r.role, email: user?.email ?? "—", createdAt: r.created_at };
  });

  return NextResponse.json(members);
}

// POST /api/staff — invitar o crear usuario
export async function POST(req: NextRequest) {
  try {
    const { storeId, email, role, password, mode } = await req.json();
    if (!storeId || !email || !role) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const VALID_ROLES = ["owner", "admin", "cajero"];
    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
    }

    if (mode === "create" && (!password || password.length < 6)) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Buscar si ya existe
    const { data: { users } } = await supabase.auth.admin.listUsers();
    let userId = users?.find(u => u.email === email)?.id;

    if (!userId) {
      if (mode === "create") {
        // Crear con email + contraseña — acceso inmediato
        const { data: created, error: createErr } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });
        if (createErr) throw createErr;
        userId = created.user?.id;
      } else {
        // Invitar — Supabase envía email de invitación
        const { data: invited, error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(email, {
          data: { invited_to: storeId },
        });
        if (inviteErr) throw inviteErr;
        userId = invited.user?.id;
      }
    }

    if (!userId) throw new Error("No se pudo obtener el ID del usuario");

    // Verificar que no esté ya en el equipo
    const { data: existing } = await supabase
      .from("store_users")
      .select("user_id")
      .eq("store_id", storeId)
      .eq("user_id", userId)
      .single();

    if (existing) {
      return NextResponse.json({ error: "Este usuario ya es parte del equipo" }, { status: 409 });
    }

    await supabase.from("store_users").insert({ store_id: storeId, user_id: userId, role });

    return NextResponse.json({ success: true, userId, mode });
  } catch (err: any) {
    console.error("[POST /api/staff]", err);
    return NextResponse.json({ error: err.message ?? "Error interno" }, { status: 500 });
  }
}
