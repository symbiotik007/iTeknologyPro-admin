"use client";
import { useState } from "react";
import { Plus, Pencil, ToggleLeft, ToggleRight, Trash2, Loader2, MapPin, Phone, Navigation } from "lucide-react";
import AddressPicker from "@/components/shared/AddressPicker";

export interface Branch {
  id: string;
  store_id: string;
  name: string;
  address: string;
  phone?: string | null;
  reference?: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
}

type BranchForm = {
  name: string;
  address: string;
  phone: string;
  reference: string;
  active: boolean;
};

const EMPTY: BranchForm = { name: "", address: "", phone: "", reference: "", active: true };

export default function BranchManager({
  storeId,
  initialBranches,
}: {
  storeId: string;
  initialBranches: Branch[];
}) {
  const [branches, setBranches] = useState<Branch[]>(initialBranches);
  const [editing, setEditing]   = useState<(BranchForm & { id?: string }) | null>(null);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);

  const openNew  = () => { setError(null); setEditing({ ...EMPTY }); };
  const openEdit = (b: Branch) => {
    setError(null);
    setEditing({ id: b.id, name: b.name, address: b.address, phone: b.phone ?? "", reference: b.reference ?? "", active: b.active });
  };

  const save = async () => {
    if (!editing || !editing.name.trim() || !editing.address.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const isEdit = !!editing.id;
      const url    = isEdit ? `/api/branches/${editing.id}` : "/api/branches";
      const res    = await fetch(url, {
        method:  isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ...editing, store_id: storeId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al guardar");
      if (isEdit) {
        setBranches(prev => prev.map(b => b.id === data.id ? data : b));
      } else {
        setBranches(prev => [...prev, data]);
      }
      setEditing(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (branch: Branch) => {
    const res = await fetch(`/api/branches/${branch.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ active: !branch.active }),
    });
    if (res.ok) setBranches(prev => prev.map(b => b.id === branch.id ? { ...b, active: !b.active } : b));
  };

  const remove = async (branch: Branch) => {
    if (!confirm(`¿Eliminar la sede "${branch.name}"? Esta acción no se puede deshacer.`)) return;
    setDeleting(branch.id);
    const res = await fetch(`/api/branches/${branch.id}`, { method: "DELETE" });
    if (res.ok) setBranches(prev => prev.filter(b => b.id !== branch.id));
    setDeleting(null);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Sedes registradas</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {branches.length} sede{branches.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Agregar sede
          </button>
        </div>

        {/* Empty state */}
        {branches.length === 0 && (
          <div className="px-6 py-16 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-7 h-7 text-gray-400" />
            </div>
            <p className="font-semibold text-gray-700">Sin sedes todavía</p>
            <p className="text-sm text-gray-400 mt-1 mb-4">
              Agrega las ubicaciones donde opera tu negocio
            </p>
            <button
              onClick={openNew}
              className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" /> Primera sede
            </button>
          </div>
        )}

        {/* List */}
        {branches.length > 0 && (
          <div className="divide-y divide-gray-50">
            {branches.map(branch => (
              <div
                key={branch.id}
                className={`px-6 py-4 flex items-start gap-4 transition-opacity ${!branch.active ? "opacity-50" : ""}`}
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="w-5 h-5 text-brand-500" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-sm text-gray-900">{branch.name}</p>
                    {!branch.active && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                        Inactiva
                      </span>
                    )}
                  </div>
                  <p className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
                    <Navigation className="w-3 h-3 flex-shrink-0" />
                    {branch.address}
                  </p>
                  {branch.reference && (
                    <p className="text-xs text-gray-400 mt-0.5 pl-4">{branch.reference}</p>
                  )}
                  {branch.phone && (
                    <a
                      href={`tel:${branch.phone}`}
                      className="flex items-center gap-1.5 text-xs text-brand-500 hover:underline mt-1"
                    >
                      <Phone className="w-3 h-3" /> {branch.phone}
                    </a>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => toggleActive(branch)}
                    title={branch.active ? "Desactivar" : "Activar"}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {branch.active
                      ? <ToggleRight className="w-5 h-5 text-green-500" />
                      : <ToggleLeft  className="w-5 h-5 text-gray-400" />}
                  </button>
                  <button
                    onClick={() => openEdit(branch)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => remove(branch)}
                    disabled={deleting === branch.id}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    {deleting === branch.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Trash2   className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90dvh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">
                {editing.id ? "Editar sede" : "Nueva sede"}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Nombre de la sede *
                </label>
                <input
                  value={editing.name}
                  onChange={e => setEditing(p => ({ ...p!, name: e.target.value }))}
                  placeholder="Ej: Sede Norte, Centro Comercial..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Dirección *
                </label>
                <AddressPicker
                  value={editing.address}
                  onChange={val => setEditing(p => ({ ...p!, address: val }))}
                  placeholder="Calle 123 # 45-67, ciudad..."
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Referencia (opcional)
                </label>
                <input
                  value={editing.reference}
                  onChange={e => setEditing(p => ({ ...p!, reference: e.target.value }))}
                  placeholder="Al lado del parque, piso 2..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Teléfono (opcional)
                </label>
                <input
                  value={editing.phone}
                  onChange={e => setEditing(p => ({ ...p!, phone: e.target.value }))}
                  placeholder="+57 300 000 0000"
                  type="tel"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.active}
                  onChange={e => setEditing(p => ({ ...p!, active: e.target.checked }))}
                  className="w-4 h-4 rounded accent-brand-500"
                />
                <span className="text-sm font-medium text-gray-700">Sede activa</span>
              </label>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Cancelar
              </button>
              <button
                onClick={save}
                disabled={saving || !editing.name.trim() || !editing.address.trim()}
                className="px-5 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {saving ? "Guardando..." : "Guardar sede"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
