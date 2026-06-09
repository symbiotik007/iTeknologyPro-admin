"use client";
import { useState } from "react";
import type { Product, Category } from "@/lib/types";
import { formatCOP } from "@/lib/utils";
import { Plus, Pencil, ToggleLeft, ToggleRight, Loader2, Trash2, Tag, UtensilsCrossed } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ProductForm = Omit<Product, "id" | "store_id" | "created_at" | "sort_order">;
type CategoryForm = { title: string; cat: string; img: string };

const EMPTY_PRODUCT: ProductForm = { title: "", description: "", price: 0, cat: "", img: "", active: true };
const EMPTY_CATEGORY: CategoryForm = { title: "", cat: "", img: "" };

type Props = {
  storeId: string;
  initialProducts: Product[];
  initialCategories: Category[];
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function MenuManager({ storeId, initialProducts, initialCategories }: Props) {
  const [mainTab, setMainTab]   = useState<"products" | "categories">("products");

  return (
    <div className="space-y-4">
      {/* Main tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {([["products", UtensilsCrossed, "Productos"], ["categories", Tag, "Categorías"]] as const).map(
          ([key, Icon, label]) => (
            <button
              key={key}
              onClick={() => setMainTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                mainTab === key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          )
        )}
      </div>

      {mainTab === "products"   && <ProductsTab   storeId={storeId} initialProducts={initialProducts}   initialCategories={initialCategories} />}
      {mainTab === "categories" && <CategoriesTab storeId={storeId} initialCategories={initialCategories} />}
    </div>
  );
}

// ─── Products Tab ─────────────────────────────────────────────────────────────

function ProductsTab({ storeId, initialProducts, initialCategories }: Props) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [cats]                  = useState<Category[]>(initialCategories);
  const [editing, setEditing]   = useState<Partial<Product> | null>(null);
  const [saving, setSaving]     = useState(false);
  const [tab, setTab]           = useState<string>("all");

  const displayed = tab === "all" ? products : products.filter(p => p.cat === tab);

  const toggleActive = async (product: Product) => {
    const res = await fetch(`/api/products/${product.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ active: !product.active }),
    });
    if (res.ok) setProducts(prev => prev.map(p => p.id === product.id ? { ...p, active: !p.active } : p));
  };

  const saveProduct = async () => {
    if (!editing) return;
    setSaving(true);
    if (editing.id) {
      const res = await fetch(`/api/products/${editing.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(editing),
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(prev => prev.map(p => p.id === data.id ? data : p));
      }
    } else {
      const res = await fetch("/api/products", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ...editing, store_id: storeId }),
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(prev => [data, ...prev]);
      }
    }
    setSaving(false);
    setEditing(null);
  };

  return (
    <div className="space-y-4">
      {/* Category filter tabs */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setTab("all")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${tab === "all" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
        >
          Todos ({products.length})
        </button>
        {cats.map(c => (
          <button
            key={c.cat}
            onClick={() => setTab(c.cat)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${tab === c.cat ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {c.title} ({products.filter(p => p.cat === c.cat).length})
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Productos</h2>
          <button
            onClick={() => setEditing({ ...EMPTY_PRODUCT, store_id: storeId })}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Agregar
          </button>
        </div>

        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Producto", "Categoría", "Precio", "Estado", ""].map(h => (
                <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {displayed.map(p => (
              <tr key={p.id} className={`${!p.active ? "opacity-50" : ""} hover:bg-gray-50`}>
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    {p.img && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.img} alt={p.title} className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                    )}
                    <div>
                      <p className="font-medium text-sm text-gray-800">{p.title}</p>
                      {p.description && <p className="text-xs text-gray-400 truncate max-w-xs">{p.description}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-3.5 text-sm text-gray-500 capitalize">{p.cat}</td>
                <td className="px-6 py-3.5 text-sm font-semibold text-gray-800">{formatCOP(p.price)}</td>
                <td className="px-6 py-3.5">
                  <button onClick={() => toggleActive(p)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
                    {p.active
                      ? <><ToggleRight className="w-5 h-5 text-green-500" /> Activo</>
                      : <><ToggleLeft  className="w-5 h-5 text-gray-400" /> Inactivo</>}
                  </button>
                </td>
                <td className="px-6 py-3.5">
                  <button onClick={() => setEditing(p)} className="text-gray-400 hover:text-gray-700">
                    <Pencil className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {displayed.length === 0 && (
          <div className="px-6 py-10 text-center text-gray-400 text-sm">Sin productos en esta categoría</div>
        )}
      </div>

      {/* Product modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">{editing.id ? "Editar producto" : "Nuevo producto"}</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Nombre *</label>
                <input
                  value={editing.title ?? ""}
                  onChange={e => setEditing(p => ({ ...p!, title: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Descripción</label>
                <textarea
                  value={editing.description ?? ""}
                  onChange={e => setEditing(p => ({ ...p!, description: e.target.value }))}
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Precio (COP) *</label>
                  <input
                    type="number"
                    value={editing.price ?? 0}
                    onChange={e => setEditing(p => ({ ...p!, price: Number(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Categoría *</label>
                  <select
                    value={editing.cat ?? ""}
                    onChange={e => setEditing(p => ({ ...p!, cat: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">Selecciona...</option>
                    {cats.map(c => <option key={c.cat} value={c.cat}>{c.title}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">URL de imagen</label>
                <input
                  value={editing.img ?? ""}
                  onChange={e => setEditing(p => ({ ...p!, img: e.target.value }))}
                  placeholder="https://..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">Cancelar</button>
              <button
                onClick={saveProduct}
                disabled={saving}
                className="px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Categories Tab ───────────────────────────────────────────────────────────

function CategoriesTab({ storeId, initialCategories }: { storeId: string; initialCategories: Category[] }) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [editing, setEditing]       = useState<(CategoryForm & { id?: number }) | null>(null);
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState<number | null>(null);
  const [error, setError]           = useState<string | null>(null);

  const openNew  = () => { setError(null); setEditing({ ...EMPTY_CATEGORY }); };
  const openEdit = (c: Category) => {
    setError(null);
    setEditing({ id: c.id, title: c.title, cat: c.cat, img: c.img ?? "" });
  };

  const save = async () => {
    if (!editing || !editing.title.trim() || !editing.cat.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const isEdit = !!editing.id;
      const url    = isEdit ? `/api/categories/${editing.id}` : "/api/categories";
      const res    = await fetch(url, {
        method:  isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ...editing, store_id: storeId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al guardar");
      if (isEdit) {
        setCategories(prev => prev.map(c => c.id === data.id ? data : c));
      } else {
        setCategories(prev => [...prev, data]);
      }
      setEditing(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (cat: Category) => {
    if (!confirm(`¿Eliminar la categoría "${cat.title}"?`)) return;
    setDeleting(cat.id);
    const res = await fetch(
      `/api/categories/${cat.id}?cat=${encodeURIComponent(cat.cat)}&storeId=${storeId}`,
      { method: "DELETE" }
    );
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "Error al eliminar");
    } else {
      setCategories(prev => prev.filter(c => c.id !== cat.id));
    }
    setDeleting(null);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Categorías</h2>
            <p className="text-xs text-gray-400 mt-0.5">{categories.length} categoría{categories.length !== 1 ? "s" : ""}</p>
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Agregar
          </button>
        </div>

        {categories.length === 0 && (
          <div className="px-6 py-12 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Tag className="w-6 h-6 text-gray-400" />
            </div>
            <p className="font-semibold text-gray-700 mb-1">Sin categorías</p>
            <p className="text-sm text-gray-400">Las categorías organizan tu menú</p>
          </div>
        )}

        {categories.length > 0 && (
          <div className="divide-y divide-gray-50">
            {categories.map(cat => (
              <div key={cat.id} className="px-6 py-3.5 flex items-center gap-4">
                {cat.img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cat.img} alt={cat.title} className="w-12 h-12 rounded-xl object-cover bg-gray-100 flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Tag className="w-5 h-5 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900">{cat.title}</p>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">/{cat.cat}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => remove(cat)}
                    disabled={deleting === cat.id}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                  >
                    {deleting === cat.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">{editing.id ? "Editar categoría" : "Nueva categoría"}</h3>
            </div>
            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">{error}</div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Nombre *</label>
                <input
                  value={editing.title}
                  onChange={e => {
                    const title = e.target.value;
                    const slug  = !editing.id
                      ? title.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
                      : editing.cat;
                    setEditing(p => ({ ...p!, title, cat: slug }));
                  }}
                  placeholder="Ej: Parrilladas, Bebidas..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Slug (URL) *</label>
                <input
                  value={editing.cat}
                  onChange={e => setEditing(p => ({ ...p!, cat: e.target.value }))}
                  placeholder="parrilladas"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <p className="text-xs text-gray-400 mt-1">Solo letras minúsculas, números y guiones</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">URL de imagen</label>
                <input
                  value={editing.img}
                  onChange={e => setEditing(p => ({ ...p!, img: e.target.value }))}
                  placeholder="https://..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                {editing.img && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={editing.img} alt="" className="mt-2 w-full h-32 object-cover rounded-lg bg-gray-100" onError={e => (e.currentTarget.style.display = "none")} />
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">Cancelar</button>
              <button
                onClick={save}
                disabled={saving || !editing.title.trim() || !editing.cat.trim()}
                className="px-5 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
