import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function GET(req: NextRequest) {
  const storeId = req.nextUrl.searchParams.get("storeId");
  if (!storeId) return NextResponse.json({ error: "storeId requerido" }, { status: 400 });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("branches")
    .select("*")
    .eq("store_id", storeId)
    .order("sort_order");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.store_id || !body.name || !body.address) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("branches")
      .insert({
        store_id:   body.store_id,
        name:       body.name,
        address:    body.address,
        phone:      body.phone   ?? null,
        reference:  body.reference ?? null,
        active:     body.active  ?? true,
        sort_order: body.sort_order ?? 0,
        lat:        body.lat ?? null,
        lng:        body.lng ?? null,
        coverage:   body.coverage ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[POST /api/branches]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
