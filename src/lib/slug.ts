// nombre de tienda → slug url-safe (= id de la tienda en Supabase = /t/<slug>)
// NFD separa la letra base de su acento; al quitar lo no-ASCII queda "café"→"cafe".
export const slugify = (s: string): string =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^\x00-\x7F]/g, "")     // quita acentos/diacríticos
    .replace(/[^a-z0-9]+/g, "-")      // resto → guiones
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "tienda";
