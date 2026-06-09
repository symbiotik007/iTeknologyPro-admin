import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

// POST /api/orders — la tienda crea un pedido
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.store_id || !body.items || !body.customer) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("orders")
      .insert({
        id:           body.id,
        store_id:     body.store_id,
        status:       "pendiente",
        items:        body.items,
        total:        body.total,
        subtotal:     body.subtotal ?? body.total,
        delivery_fee: body.deliveryFee ?? 0,
        delivery:     body.delivery,
        payment:      body.payment,
        branch:       body.branch ?? null,
        customer:     body.customer,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[POST /api/orders]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// GET /api/orders?storeId=donparra — lista órdenes de un store
export async function GET(req: NextRequest) {
  const storeId = req.nextUrl.searchParams.get("storeId");
  if (!storeId) return NextResponse.json({ error: "storeId requerido" }, { status: 400 });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
