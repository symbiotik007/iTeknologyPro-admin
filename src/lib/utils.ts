import { clsx, type ClassValue } from "clsx";
import type { OrderStatus } from "./types";

export const cn = (...inputs: ClassValue[]) => clsx(inputs);

export const formatCOP = (amount: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(amount);

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" });

export const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return "ahora";
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `hace ${hrs} h`;
  return formatDate(iso);
};

export const STATUS_META: Record<OrderStatus, { label: string; color: string; next?: OrderStatus }> = {
  "pendiente":       { label: "Pendiente",       color: "amber",  next: "en preparación" },
  "en preparación":  { label: "En preparación",  color: "blue",   next: "listo"          },
  "listo":           { label: "Preparado",        color: "green",  next: "en camino"      },
  "en camino":       { label: "En camino",        color: "purple", next: "entregado"      },
  "entregado":       { label: "Entregado",        color: "slate"                          },
};

// El paso "en camino" solo aplica a domicilios; al recoger en tienda,
// de "Preparado" se pasa directo a "Entregado".
export const nextStatusFor = (order: { status: OrderStatus; delivery?: string }): OrderStatus | undefined => {
  if (order.status === "listo" && order.delivery !== "domicilio") return "entregado";
  return STATUS_META[order.status]?.next;
};

// Paso anterior del flujo — para corregir cuando la tienda avanzó por error
export const prevStatusFor = (order: { status: OrderStatus; delivery?: string }): OrderStatus | undefined => {
  switch (order.status) {
    case "en preparación": return "pendiente";
    case "listo":          return "en preparación";
    case "en camino":      return "listo";
    case "entregado":      return order.delivery === "domicilio" ? "en camino" : "listo";
    default:               return undefined;
  }
};

export const PAYMENT_LABELS: Record<string, string> = {
  efectivo:      "Efectivo",
  nequi:         "Nequi / Daviplata",
  daviplata:     "Daviplata", // pedidos antiguos, antes de fusionarse con Nequi
  transferencia: "Transferencia",
};
