import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    if (body.cat) body.cat = body.cat.toLowerCase().replace(/\s+/g, "-");

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("categories")
      .update(body)
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error("[PATCH /api/categories/:id]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServiceClient();

  // Verificar si hay productos en esta categoría antes de borrar
  const catSlug = req.nextUrl.searchParams.get("cat");
  const storeId = req.nextUrl.searchParams.get("storeId");

  if (catSlug && storeId) {
    const { count } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("store_id", storeId)
      .eq("cat", catSlug);

    if (count && count > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar: hay ${count} producto(s) en esta categoría` },
        { status: 409 }
      );
    }
  }

  const { error } = await supabase.from("categories").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
