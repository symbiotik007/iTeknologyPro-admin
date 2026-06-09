import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// GET /api/orders/:id/proof — genera un signed URL temporal del comprobante Nequi
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServiceClient();

  const { data: order, error } = await supabase
    .from("orders").select("payment_proof").eq("id", params.id).single();

  const path = (order?.payment_proof as { url?: string } | null)?.url;
  if (error || !path) {
    return NextResponse.json({ error: "Sin comprobante" }, { status: 404 });
  }

  const { data, error: signErr } = await supabase
    .storage.from("payment-proofs").createSignedUrl(path, 3600); // 1 hora

  if (signErr || !data) {
    return NextResponse.json({ error: "No se pudo generar el enlace" }, { status: 500 });
  }
  return NextResponse.json({ url: data.signedUrl });
}
