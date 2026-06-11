"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, ClipboardList, UtensilsCrossed, Settings, LogOut, Flame, ChevronDown, MapPin, Menu, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { switchStore } from "@/app/actions";
import { cn } from "@/lib/utils";
import type { StoreEntry } from "@/lib/store-context";
import StorePowerToggle from "./StorePowerToggle";

const NAV = [
  { href: "/dashboard",            icon: LayoutDashboard,  label: "Resumen"     },
  { href: "/dashboard/orders",     icon: ClipboardList,    label: "Pedidos"     },
  { href: "/dashboard/menu",       icon: UtensilsCrossed,  label: "Menú"        },
  { href: "/dashboard/branches",   icon: MapPin,           label: "Sucursales"  },
  { href: "/dashboard/settings",   icon: Settings,         label: "Configuración" },
];

type Props = { stores: StoreEntry[]; activeStoreId: string };

export default function Sidebar({ stores, activeStoreId }: Props) {
  const pathname = usePathname();
  const router   = useRouter();
  const active   = stores.find(s => s.id === activeStoreId) ?? stores[0];
  const [open, setOpen] = useState(false);

  // Cierra el drawer al navegar
  useEffect(() => { setOpen(false); }, [pathname]);

  // Bloquea el scroll del body con el drawer abierto
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      {/* ── Header móvil (fijo arriba, solo < md) ── */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 h-14 bg-gray-950 border-b border-gray-800 flex items-center gap-3 px-3">
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          className="p-2.5 -ml-1 text-gray-300 hover:text-white rounded-lg active:bg-gray-800"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center flex-shrink-0">
          <Flame className="w-4 h-4 text-white" />
        </div>
        <p className="text-white font-semibold text-sm truncate flex-1">{active?.name ?? "Mi Tienda"}</p>
      </header>

      {/* ── Overlay del drawer (móvil) ── */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar: drawer en móvil, estático en desktop ── */}
      <aside
        className={cn(
          "fixed md:static inset-y-0 left-0 z-50 w-72 max-w-[85vw] md:w-60 md:max-w-none",
          "bg-gray-950 border-r border-gray-800 flex flex-col md:min-h-screen",
          "transform transition-transform duration-200 ease-out md:transform-none",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Logo + store switcher */}
        <div className="px-4 py-4 border-b border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center flex-shrink-0">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white font-semibold text-sm truncate">{active?.name ?? "Mi Tienda"}</p>
              <p className="text-gray-500 text-xs">Admin Panel</p>
            </div>
            {/* Cerrar drawer (solo móvil) */}
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar menú"
              className="md:hidden p-2 text-gray-400 hover:text-white rounded-lg active:bg-gray-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Store switcher — solo aparece si el usuario tiene acceso a 2+ tiendas */}
          {stores.length > 1 && (
            <form action={switchStore}>
              <div className="relative">
                <select
                  name="storeId"
                  defaultValue={activeStoreId}
                  onChange={e => (e.target.form as HTMLFormElement).requestSubmit()}
                  className="w-full bg-gray-800 text-gray-300 text-xs font-medium rounded-lg px-3 py-2 pr-7 border border-gray-700 appearance-none cursor-pointer focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                >
                  {stores.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </form>
          )}

          {/* Interruptor maestro: apagar/encender la tienda */}
          {active && <StorePowerToggle storeId={active.id} />}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, icon: Icon, label }) => {
            const isActive = href === "/dashboard"
              ? pathname === href
              : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-brand-500 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-gray-800">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}
