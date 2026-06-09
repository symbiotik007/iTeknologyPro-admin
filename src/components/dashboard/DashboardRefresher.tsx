"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

const INTERVAL = 30_000;

export default function DashboardRefresher() {
  const router   = useRouter();
  const [next, setNext] = useState(INTERVAL / 1000);

  useEffect(() => {
    const tick = setInterval(() => {
      setNext(prev => {
        if (prev <= 1) {
          router.refresh();
          return INTERVAL / 1000;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [router]);

  return (
    <button
      onClick={() => { router.refresh(); setNext(INTERVAL / 1000); }}
      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100"
      title="Actualizar ahora"
    >
      <RefreshCw className="w-3.5 h-3.5" />
      Actualiza en {next}s
    </button>
  );
}
