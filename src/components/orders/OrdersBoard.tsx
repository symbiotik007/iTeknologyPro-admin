"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import type { Order, OrderStatus } from "@/lib/types";
import { formatCOP, timeAgo, STATUS_META, PAYMENT_LABELS } from "@/lib/utils";
import StatusBadge from "./StatusBadge";
import { ChevronRight, MapPin, Phone, ShoppingBag, Bike, Store, RefreshCw } from "lucide-react";

const POLL_INTERVAL = 10_000; // 10 segundos

export default function OrdersBoard({ storeId, initialOrders = [] }: { storeId: string; initialOrders?: Order[] }) {
  const [orders, setOrders]       = useState<Order[]>(initialOrders);
  const [selected, setSelected]   = useState<Order | null>(null);
  const [updating, setUpdating]   = useState<string | null>(null);
  const [filter, setFilter]       = useState<OrderStatus | "todos">("todos");
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [newBadge, setNewBadge]   = useState(false);
  const prevIdsRef                = useRef<Set<string>>(new Set(initialOrders.map(o => o.id)));

  const load = useCallback(async () => {
    const res = await fetch(`/api/orders?storeId=${storeId}`);
    if (!res.ok) return;
    const data: Order[] = await res.json();

    // Detectar pedidos nuevos vs los anteriores
    const newOrders = data.filter(o => !prevIdsRef.current.has(o.id));
    if (newOrders.length > 0) {
      setNewBadge(true);
      setTimeout(() => setNewBadge(false), 4000);
      // Notificación del navegador
      if (Notification.permission === "granted") {
        newOrders.forEach(o => {
          new Notification("🔥 Nuevo pedido", {
            body: `${o.customer?.name} — ${formatCOP(o.total)}`,
          });
        });
      }
      // Sonido simple via AudioContext
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(660, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start(); osc.stop(ctx.currentTime + 0.4);
      } catch {}
    }

    prevIdsRef.current = new Set(data.map(o => o.id));
    setOrders(data);
    setLastUpdate(new Date());
  }, [storeId]);

  // Carga inicial + polling cada 10s
  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [load]);

  // Solicitar permiso de notificaciones
  useEffect(() => {
    if (Notification.permission === "default") Notification.requestPermission();
  }, []);

  const advance = async (order: Order) => {
    const next = STATUS_META[order.status]?.next;
    if (!next) return;
    setUpdating(order.id);
    await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: next } : o));
    setSelected(prev => prev?.id === order.id ? { ...prev, status: next } : prev);
    setUpdating(null);
  };

  // Abre el comprobante Nequi en una pestaña nueva (signed URL temporal)
  const viewProof = async (order: Order) => {
    const res = await fetch(`/api/orders/${order.id}/proof`);
    if (!res.ok) { alert("No se encontró el comprobante"); return; }
    const { url } = await res.json();
    window.open(url, "_blank", "noopener");
  };

  // Marca el comprobante como verificado (true) o falso (false)
  const setProof = async (order: Order, verified: boolean) => {
    setUpdating(order.id);
    const res = await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proof_verified: verified }),
    });
    if (res.ok) {
      const updated: Order = await res.json();
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, payment_proof: updated.payment_proof } : o));
      setSelected(prev => prev?.id === order.id ? { ...prev, payment_proof: updated.payment_proof } : prev);
    }
    setUpdating(null);
  };

  const filtered = filter === "todos" ? orders : orders.filter(o => o.status === filter);

  const counts = {
    todos:           orders.length,
    pendiente:       orders.filter(o => o.status === "pendiente").length,
    "en preparación": orders.filter(o => o.status === "en preparación").length,
    listo:           orders.filter(o => o.status === "listo").length,
    entregado:       orders.filter(o => o.status === "entregado").length,
  };

  return (
    <div className="flex h-full">
      {/* Lista */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Filtros + indicador */}
        <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center gap-2 flex-wrap">
          <div className="flex gap-2 flex-wrap flex-1">
          {(["todos", "pendiente", "en preparación", "listo", "entregado"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                filter === f
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f === "todos" ? "Todos" : STATUS_META[f].label}
              <span className="text-xs opacity-70">{counts[f]}</span>
            </button>
          ))}
          </div>

          {/* Badge nuevo pedido + refresh indicator */}
          <div className="flex items-center gap-2 ml-auto">
            {newBadge && (
              <span className="flex items-center gap-1.5 bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full animate-pulse">
                🔥 Nuevo pedido
              </span>
            )}
            <button
              onClick={load}
              title="Actualizar ahora"
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {lastUpdate.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </button>
          </div>
        </div>

        {/* Tabla */}
        <div className="flex-1 overflow-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <ShoppingBag className="w-10 h-10 mb-3 opacity-40" />
              <p className="font-medium">Sin pedidos</p>
              <p className="text-sm">Los pedidos nuevos aparecerán aquí en tiempo real</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pedido</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Hace</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(order => (
                  <tr
                    key={order.id}
                    onClick={() => setSelected(order)}
                    className={`cursor-pointer transition-colors ${
                      selected?.id === order.id ? "bg-brand-50" : "hover:bg-gray-50"
                    } ${order.status === "pendiente" ? "border-l-4 border-l-amber-400" : ""}`}
                  >
                    <td className="px-6 py-3.5">
                      <span className="font-mono text-sm font-semibold text-gray-800">{order.id}</span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-700">{order.customer?.name}</td>
                    <td className="px-4 py-3.5">
                      <span className="flex items-center gap-1.5 text-sm text-gray-600">
                        {order.delivery === "domicilio"
                          ? <><Bike className="w-3.5 h-3.5" /> Domicilio</>
                          : <><Store className="w-3.5 h-3.5" /> Recoger</>}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm font-semibold text-gray-800">{formatCOP(order.total)}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={order.status} /></td>
                    <td className="px-4 py-3.5 text-sm text-gray-400">{timeAgo(order.created_at)}</td>
                    <td className="px-4 py-3.5">
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Panel lateral de detalle */}
      {selected && (
        <div className="w-96 border-l border-gray-200 bg-white overflow-auto flex-shrink-0">
          <div className="p-6 border-b border-gray-100 flex items-start justify-between">
            <div>
              <p className="font-mono text-sm font-bold text-gray-800">{selected.id}</p>
              <p className="text-xs text-gray-400 mt-0.5">{timeAgo(selected.created_at)}</p>
            </div>
            <StatusBadge status={selected.status} />
          </div>

          {/* Cliente */}
          <div className="p-6 border-b border-gray-100 space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Cliente</p>
            <p className="font-semibold text-gray-800">{selected.customer?.name}</p>
            <a href={`tel:${selected.customer?.phone}`} className="flex items-center gap-2 text-sm text-brand-500 hover:underline">
              <Phone className="w-3.5 h-3.5" />
              {selected.customer?.phone}
            </a>
            {selected.customer?.address && (
              <p className="flex items-start gap-2 text-sm text-gray-600">
                <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                {selected.customer.address}
              </p>
            )}
            {selected.customer?.notes && (
              <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                📝 {selected.customer.notes}
              </p>
            )}
          </div>

          {/* Items */}
          <div className="p-6 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Pedido</p>
            <div className="space-y-2">
              {selected.items?.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-700">{item.qty}x {item.title}</span>
                  <span className="font-semibold text-gray-800">{formatCOP(item.price * item.qty)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-brand-500">{formatCOP(selected.total)}</span>
            </div>
            {selected.delivery_fee > 0 && (
              <p className="text-xs text-gray-400 mt-1 text-right">
                Incluye domicilio {formatCOP(selected.delivery_fee)}
              </p>
            )}
          </div>

          {/* Info entrega */}
          <div className="p-6 border-b border-gray-100 text-sm space-y-1.5 text-gray-600">
            <p><span className="font-medium">Entrega:</span> {selected.delivery === "domicilio" ? "🛵 A domicilio" : "🏠 Recoger en tienda"}</p>
            {selected.branch && <p><span className="font-medium">Sede:</span> {selected.branch.name}</p>}
            <p><span className="font-medium">Pago:</span> {PAYMENT_LABELS[selected.payment] ?? selected.payment}</p>
          </div>

          {/* Comprobante Nequi */}
          {selected.payment === "nequi" && (
            <div className="p-6 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Comprobante Nequi</p>
              {selected.payment_proof?.url ? (
                <>
                  {selected.payment_proof.reference && (
                    <p className="text-sm text-gray-600 mb-2">
                      Ref: <span className="font-mono">{selected.payment_proof.reference}</span>
                    </p>
                  )}

                  {/* Estado de verificación */}
                  {selected.payment_proof.verified === true && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full mb-3">
                      ✓ Comprobante verificado
                    </span>
                  )}
                  {selected.payment_proof.verified === false && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 px-2.5 py-1 rounded-full mb-3">
                      ✗ Marcado como falso
                    </span>
                  )}

                  <button
                    onClick={() => viewProof(selected)}
                    className="w-full border border-gray-200 hover:border-brand-400 hover:text-brand-600 text-gray-700 text-sm font-semibold py-2.5 rounded-lg transition-colors mb-3"
                  >
                    🧾 Ver comprobante
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setProof(selected, true)}
                      disabled={updating === selected.id}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
                    >
                      ✓ Verificado
                    </button>
                    <button
                      onClick={() => setProof(selected, false)}
                      disabled={updating === selected.id}
                      className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
                    >
                      ✗ Falso
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-400">
                  El cliente no subió comprobante (puede enviarlo por WhatsApp).
                </p>
              )}
            </div>
          )}

          {/* Acción */}
          {STATUS_META[selected.status]?.next && (
            <div className="p-6">
              <button
                onClick={() => advance(selected)}
                disabled={updating === selected.id}
                className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                {updating === selected.id
                  ? "Actualizando..."
                  : `Marcar como "${STATUS_META[STATUS_META[selected.status].next!].label}"`}
              </button>
            </div>
          )}
          {selected.status === "entregado" && (
            <div className="px-6 pb-6 text-center text-sm text-gray-400">✅ Pedido completado</div>
          )}
        </div>
      )}
    </div>
  );
}
