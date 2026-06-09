import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getStoreContext } from "@/lib/store-context";
import { formatCOP } from "@/lib/utils";
import { ShoppingBag, TrendingUp, Clock, CheckCircle } from "lucide-react";
import type { Order } from "@/lib/types";
import DashboardRefresher from "@/components/dashboard/DashboardRefresher";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { activeStoreId } = await getStoreContext(user.id);
  const admin = createServiceClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [{ data: todayOrders }, { data: recent }] = await Promise.all([
    admin.from("orders").select("*").eq("store_id", activeStoreId).gte("created_at", today.toISOString()),
    admin.from("orders").select("*").eq("store_id", activeStoreId).order("created_at", { ascending: false }).limit(5),
  ]);

  const orders  = (todayOrders ?? []) as Order[];
  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const pending = orders.filter(o => o.status === "pendiente").length;
  const inPrep  = orders.filter(o => o.status === "en preparación").length;
  const done    = orders.filter(o => o.status === "entregado").length;

  const stats = [
    { label: "Pedidos hoy",    value: orders.length,      icon: ShoppingBag, color: "text-blue-500",   bg: "bg-blue-50"  },
    { label: "Ingresos hoy",   value: formatCOP(revenue),  icon: TrendingUp,  color: "text-green-500",  bg: "bg-green-50" },
    { label: "En preparación", value: inPrep,              icon: Clock,       color: "text-amber-500",  bg: "bg-amber-50" },
    { label: "Entregados",     value: done,                icon: CheckCircle, color: "text-brand-500",  bg: "bg-brand-50" },
  ];

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resumen del día</h1>
          <p className="text-gray-500 text-sm mt-1">
            {new Date().toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        {/* Auto-refresh cada 30s */}
        <DashboardRefresher />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className={`inline-flex p-2.5 rounded-xl ${bg} mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Alerta pendientes */}
      {pending > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
          <span className="text-2xl">⚡</span>
          <div>
            <p className="font-semibold text-amber-800">
              {pending} pedido{pending > 1 ? "s" : ""} pendiente{pending > 1 ? "s" : ""} de confirmar
            </p>
            <a href="/dashboard/orders" className="text-sm text-amber-600 underline">Ver pedidos →</a>
          </div>
        </div>
      )}

      {/* Últimos pedidos */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Últimos pedidos</h2>
          <a href="/dashboard/orders" className="text-sm text-brand-500 font-semibold hover:underline">
            Ver todos →
          </a>
        </div>
        {(recent ?? []).length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-400 text-sm">
            Sin pedidos todavía. Cuando llegue el primero aparecerá aquí.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {["ID", "Cliente", "Total", "Estado"].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(recent as Order[]).map(o => (
                <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3.5 font-mono text-sm font-semibold text-gray-700">{o.id}</td>
                  <td className="px-6 py-3.5 text-sm text-gray-700">{o.customer?.name}</td>
                  <td className="px-6 py-3.5 text-sm font-semibold text-gray-800">{formatCOP(o.total)}</td>
                  <td className="px-6 py-3.5">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      o.status === "pendiente"       ? "bg-amber-100 text-amber-700" :
                      o.status === "en preparación"  ? "bg-blue-100 text-blue-700"  :
                      o.status === "listo"           ? "bg-purple-100 text-purple-700" :
                      "bg-green-100 text-green-700"
                    }`}>
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
