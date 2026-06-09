import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("stores").select("id, name, config").eq("id", params.id).single();

  if (error || !data) return NextResponse.json({ error: "Store no encontrado" }, { status: 404 });
  return NextResponse.json({ id: data.id, name: data.name, ...data.config });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("stores").update(body).eq("id", params.id).select().single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
