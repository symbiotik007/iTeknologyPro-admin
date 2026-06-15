// Base URL del storefront multi-tenant (donde viven los links /t/<slug>).
// Prioridad: NEXT_PUBLIC_STORE_URL (configurable por entorno / dominio premium)
// → fallback al despliegue de producción conocido (para que NUNCA salga vacío).
const FALLBACK = "https://restaurant-e-commerce-inky.vercel.app";

export const STORE_URL = (
  (process.env.NEXT_PUBLIC_STORE_URL || "").trim() || FALLBACK
).replace(/\/$/, "");

export const demoLink = (slug: string) => `${STORE_URL}/t/${slug}`;
