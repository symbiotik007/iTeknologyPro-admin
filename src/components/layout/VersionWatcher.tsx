"use client";
import { useEffect } from "react";

// Detector de deployments nuevos (misma idea que en el ecommerce).
// Consulta /api/version cada 3 min y al volver a la pestaña; si el deployment
// cambió, recarga para que las pestañas abiertas (p.ej. Pedidos en la tablet
// del local) nunca se queden corriendo una versión vieja del panel.
const CHECK_INTERVAL_MS = 3 * 60 * 1000;
const RELOAD_GUARD_KEY  = "admin:forced-reload-version";

let runningVersion: string | null = null;

const fetchVersion = async (): Promise<string | null> => {
  try {
    const res = await fetch(`/api/version?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    const v = data?.version;
    return typeof v === "string" && v !== "dev" ? v : null;
  } catch {
    return null;
  }
};

const reloadOnce = (nextVersion: string) => {
  try {
    if (sessionStorage.getItem(RELOAD_GUARD_KEY) === nextVersion) return;
    sessionStorage.setItem(RELOAD_GUARD_KEY, nextVersion);
  } catch { /* sessionStorage bloqueado: recargar igual una vez */ }
  window.location.reload();
};

export default function VersionWatcher() {
  useEffect(() => {
    const check = async () => {
      const latest = await fetchVersion();
      if (!latest) return;
      if (!runningVersion) { runningVersion = latest; return; }
      if (latest !== runningVersion) reloadOnce(latest);
    };

    check(); // fija la versión con la que arrancó esta pestaña
    const interval = setInterval(check, CHECK_INTERVAL_MS);
    const onVisible = () => { if (document.visibilityState === "visible") check(); };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
