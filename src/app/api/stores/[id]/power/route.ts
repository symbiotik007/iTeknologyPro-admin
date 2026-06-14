import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { computePaused, type Schedule } from "@/lib/schedule";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

// GET /api/stores/:id/power — estado del interruptor de la tienda
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("stores").select("config").eq("id", params.id).single();

  if (error || !data) return NextResponse.json({ error: "Store no encontrado" }, { status: 404 });
  const schedule = (data.config?.schedule ?? null) as Schedule | null;
  return NextResponse.json({
    paused:    computePaused(data.config),       // estado efectivo (switch + horario)
    manual:    data.config?.paused === true,     // valor del switch manual
    scheduled: schedule?.enabled === true,       // ¿controlado por horario automático?
    schedule,
    storeUrl:  data.config?.storeUrl ?? null,
  });
}

// PATCH /api/stores/:id/power — { paused: boolean } apaga/enciende la tienda
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { paused } = await req.json();
    if (typeof paused !== "boolean") {
      return NextResponse.json({ error: "paused debe ser boolean" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Merge sobre config (jsonb) para no pisar el resto de la configuración
    const { data: store, error: readErr } = await supabase
      .from("stores").select("config").eq("id", params.id).single();
    if (readErr || !store) return NextResponse.json({ error: "Store no encontrado" }, { status: 404 });

    const { error } = await supabase
      .from("stores")
      .update({ config: { ...store.config, paused } })
      .eq("id", params.id);

    if (error) throw error;
    return NextResponse.json({ paused });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Error interno" }, { status: 500 });
  }
}
