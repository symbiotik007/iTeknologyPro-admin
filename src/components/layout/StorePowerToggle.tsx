"use client";
import { useState, useEffect } from "react";
import { Power, Loader2, ExternalLink } from "lucide-react";

// Interruptor maestro de la tienda: apaga/enciende la recepción de pedidos.
// Vive en el sidebar para que sea visible desde cualquier página del admin.
export default function StorePowerToggle({ storeId }: { storeId: string }) {
  const [paused, setPaused]     = useState<boolean | null>(null); // null = cargando
  const [saving, setSaving]     = useState(false);
  const [storeUrl, setStoreUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setPaused(null);
    fetch(`/api/stores/${storeId}/power`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (active && d) { setPaused(d.paused); setStoreUrl(d.storeUrl ?? null); } })
      .catch(() => {});
    return () => { active = false; };
  }, [storeId]);

  const toggle = async () => {
    if (paused === null || saving) return;
    const next = !paused;
    const msg = next
      ? "¿Apagar la tienda? Los clientes NO podrán hacer pedidos hasta que la enciendas de nuevo."
      : "¿Encender la tienda? Los clientes podrán volver a hacer pedidos.";
    if (!confirm(msg)) return;

    setSaving(true);
    const res = await fetch(`/api/stores/${storeId}/power`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paused: next }),
    });
    if (res.ok) setPaused(next);
    else alert("No se pudo cambiar el estado de la tienda. Intenta de nuevo.");
    setSaving(false);
  };

  if (paused === null) {
    return (
      <div className="mt-3 flex items-center justify-center rounded-xl border border-gray-800 bg-gray-900 py-3">
        <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <>
    <button
      onClick={toggle}
      disabled={saving}
      className={
        paused
          ? "mt-3 w-full rounded-xl border-2 border-red-500 bg-red-500/15 px-3 py-3 text-left transition-colors hover:bg-red-500/25 animate-pulse"
          : "mt-3 w-full rounded-xl border-2 border-green-500 bg-green-500/10 px-3 py-3 text-left transition-colors hover:bg-green-500/20"
      }
    >
      <span className="flex items-center gap-2.5">
        <span className={
          paused
            ? "flex h-8 w-8 items-center justify-center rounded-full bg-red-500 flex-shrink-0"
            : "flex h-8 w-8 items-center justify-center rounded-full bg-green-500 flex-shrink-0"
        }>
          {saving
            ? <Loader2 className="w-4 h-4 animate-spin text-white" />
            : <Power className="w-4 h-4 text-white" />}
        </span>
        <span className="min-w-0">
          <span className={paused ? "block text-sm font-bold text-red-400" : "block text-sm font-bold text-green-400"}>
            {paused ? "Tienda apagada" : "Tienda abierta"}
          </span>
          <span className="block text-[11px] text-gray-400 leading-tight">
            {paused ? "No recibe pedidos — toca para encender" : "Recibiendo pedidos — toca para apagar"}
          </span>
        </span>
      </span>
    </button>

    {/* Link directo a la tienda pública (se configura en Configuración → Información) */}
    {storeUrl && (
      <a
        href={storeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 flex items-center justify-center gap-2 w-full rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-xs font-semibold text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        Ver mi tienda
      </a>
    )}
    </>
  );
}
