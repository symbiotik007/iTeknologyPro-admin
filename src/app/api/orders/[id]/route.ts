import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

// GET /api/orders/:id — estado de un pedido (para el tracking del cliente)
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("orders").select("*").eq("id", params.id).single();

  if (error || !data) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  return NextResponse.json(data);
}

// PATCH /api/orders/:id — el admin cambia el estado o verifica el comprobante Nequi
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const supabase = createServiceClient();

    // Verificación del comprobante Nequi (verified true/false)
    if (typeof body.proof_verified === "boolean") {
      const { data: order } = await supabase
        .from("orders").select("payment_proof").eq("id", params.id).single();
      const proof = {
        ...(order?.payment_proof ?? {}),
        verified:   body.proof_verified,
        checked_at: new Date().toISOString(),
      };
      const { data, error } = await supabase
        .from("orders").update({ payment_proof: proof }).eq("id", params.id).select().single();
      if (error) throw error;
      return NextResponse.json(data);
    }

    // Cambio de estado
    const { status } = body;
    const VALID = ["pendiente", "en preparación", "listo", "en camino", "entregado"];
    if (!VALID.includes(status)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }

    const patch: Record<string, unknown> = { status };

    // El reloj de entrega arranca aquí: marca el inicio de preparación una sola
    // vez (si ya tenía marca, se respeta para no reiniciar la cuenta regresiva).
    if (status === "en preparación") {
      const { data: cur } = await supabase
        .from("orders").select("preparing_at").eq("id", params.id).single();
      if (!cur?.preparing_at) patch.preparing_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("orders").update(patch).eq("id", params.id).select().single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error("[PATCH /api/orders/:id]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
