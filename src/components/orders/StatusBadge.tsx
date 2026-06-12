import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types";

const STYLES: Record<OrderStatus, string> = {
  "pendiente":      "bg-amber-100 text-amber-800",
  "en preparación": "bg-blue-100 text-blue-800",
  "listo":          "bg-green-100 text-green-800",
  "en camino":      "bg-purple-100 text-purple-800",
  "entregado":      "bg-gray-100 text-gray-600",
};

const LABELS: Record<OrderStatus, string> = {
  "pendiente":      "Pendiente",
  "en preparación": "En preparación",
  "listo":          "Preparado",
  "en camino":      "En camino",
  "entregado":      "Entregado",
};

export default function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold", STYLES[status])}>
      {LABELS[status]}
    </span>
  );
}
