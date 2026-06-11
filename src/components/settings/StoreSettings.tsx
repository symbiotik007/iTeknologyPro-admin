"use client";
import { useState, useEffect } from "react";
import type { Store } from "@/lib/types";
import { Loader2, Save, UserPlus, Trash2, Shield, ChevronDown, Building2, Users, ShoppingBag, Check, X } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = { store: Store | null; storeId: string; userRole: string };

type Member   = { userId: string; email: string; role: string; createdAt: string };
type Customer = { userId: string; name: string; email: string; phone: string; createdAt: string };

// ─── Role config ─────────────────────────────────────────────────────────────

const ROLES: Record<string, { label: string; desc: string; color: string; bg: string }> = {
  owner:  { label: "Dueño",       desc: "Acceso total. Puede gestionar equipo y configuración.", color: "text-purple-700", bg: "bg-purple-100" },
  admin:  { label: "Gerente",     desc: "Gestiona menú y pedidos. No puede modificar dueños.",   color: "text-blue-700",   bg: "bg-blue-100"   },
  cajero: { label: "Cajero",      desc: "Solo ve y gestiona pedidos. Sin acceso a menú/config.",  color: "text-green-700",  bg: "bg-green-100"  },
};

function RoleBadge({ role }: { role: string }) {
  const r = ROLES[role] ?? { label: role, color: "text-gray-700", bg: "bg-gray-100" };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${r.bg} ${r.color}`}>
      <Shield className="w-3 h-3" />
      {r.label}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StoreSettings({ store, storeId, userRole }: Props) {
  const [tab, setTab] = useState<"info" | "team" | "customers">("info");
  const isOwner = userRole === "owner";
  const canManage = userRole === "owner" || userRole === "admin";

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {([["info", Building2, "Información"], ["team", Users, "Equipo"], ["customers", ShoppingBag, "Clientes"]] as const).map(([key, Icon, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "info"      && <InfoTab      store={store} storeId={storeId} canEdit={canManage} />}
      {tab === "team"      && <TeamTab      storeId={storeId} isOwner={isOwner} currentRole={userRole} />}
      {tab === "customers" && <CustomersTab storeId={storeId} />}
    </div>
  );
}

// ─── Info Tab ─────────────────────────────────────────────────────────────────

function InfoTab({ store, storeId, canEdit }: { store: Store | null; storeId: string; canEdit: boolean }) {
  const cfg = (store?.config ?? {}) as { contact?: { nequi?: string } };
  const [name, setName]     = useState(store?.name ?? "");
  const [nequi, setNequi]   = useState(cfg.contact?.nequi ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  const save = async () => {
    setSaving(true);
    const base = (store?.config ?? {}) as Record<string, unknown>;
    const config = {
      ...base,
      contact: { ...((base.contact as Record<string, unknown>) ?? {}), nequi: nequi.trim() },
    };
    await fetch(`/api/stores/${storeId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ name, config }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-5">Información del negocio</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Nombre del negocio</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={!canEdit}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">ID del store</label>
            <input value={storeId} disabled
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-gray-400 font-mono" />
            <p className="text-xs text-gray-400 mt-1">Identificador único del negocio — no puede cambiarse</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Número Nequi (para recibir pagos)</label>
            <input
              value={nequi}
              onChange={e => setNequi(e.target.value)}
              disabled={!canEdit}
              placeholder="3001234567"
              inputMode="numeric"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-50 disabled:text-gray-400"
            />
            <p className="text-xs text-gray-400 mt-1">Los clientes verán este número al pagar por Nequi en la tienda.</p>
          </div>
        </div>

        {canEdit && (
          <div className="mt-5 flex items-center gap-3">
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
            {saved && <span className="text-sm text-green-600 font-medium">✓ Guardado</span>}
          </div>
        )}
      </div>

      {/* Roles explicados */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Roles del equipo</h2>
        <div className="space-y-3">
          {Object.entries(ROLES).map(([key, r]) => (
            <div key={key} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${r.bg} ${r.color}`}>
                <Shield className="w-3 h-3" />{r.label}
              </span>
              <p className="text-sm text-gray-600 mt-0.5">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Team Tab ─────────────────────────────────────────────────────────────────

function TeamTab({ storeId, isOwner, currentRole }: { storeId: string; isOwner: boolean; currentRole: string }) {
  const [members, setMembers]   = useState<Member[]>([]);
  const [loading, setLoading]   = useState(true);
  const [mode, setMode]         = useState<"invite" | "create">("invite");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [role, setRole]         = useState("cajero");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  // Cambios de rol pendientes de guardar: userId -> nuevo rol
  const [pendingRoles, setPendingRoles] = useState<Record<string, string>>({});
  const [savingRole, setSavingRole]     = useState<string | null>(null);
  const [savedRole, setSavedRole]       = useState<string | null>(null);

  const fetchMembers = async () => {
    setLoading(true);
    const res = await fetch(`/api/staff?storeId=${storeId}`);
    if (res.ok) setMembers(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchMembers(); }, [storeId]);

  const submit = async () => {
    if (!email.trim()) return;
    if (mode === "create" && !password.trim()) { setError("La contraseña es requerida"); return; }
    setSubmitting(true); setError(null); setSuccess(null);
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, email: email.trim(), role, password, mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(mode === "invite"
        ? `✓ Invitación enviada a ${email}`
        : `✓ Usuario ${email} creado — puede iniciar sesión ahora`
      );
      setEmail(""); setPassword("");
      fetchMembers();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const selectRole = (userId: string, newRole: string) => {
    setError(null); setSavedRole(null);
    setPendingRoles(prev => {
      const current = members.find(m => m.userId === userId)?.role;
      if (newRole === current) {
        const { [userId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [userId]: newRole };
    });
  };

  const cancelRole = (userId: string) => {
    setPendingRoles(prev => {
      const { [userId]: _, ...rest } = prev;
      return rest;
    });
  };

  const saveRole = async (userId: string) => {
    const newRole = pendingRoles[userId];
    if (!newRole) return;
    setSavingRole(userId); setError(null); setSavedRole(null);
    const res = await fetch(`/api/staff/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId, role: newRole }),
    });
    if (res.ok) {
      setMembers(prev => prev.map(m => m.userId === userId ? { ...m, role: newRole } : m));
      cancelRole(userId);
      setSavedRole(userId);
      setTimeout(() => setSavedRole(prev => (prev === userId ? null : prev)), 2500);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo cambiar el rol");
    }
    setSavingRole(null);
  };

  const remove = async (member: Member) => {
    if (!confirm(`¿Remover a ${member.email} del equipo?`)) return;
    setRemoving(member.userId);
    setError(null);
    const res = await fetch(`/api/staff/${member.userId}?storeId=${storeId}`, { method: "DELETE" });
    if (res.ok) {
      setMembers(prev => prev.filter(m => m.userId !== member.userId));
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo remover al miembro");
    }
    setRemoving(null);
  };

  // Cuántos dueños quedan — para proteger al último
  const ownerCount = members.filter(m => m.role === "owner").length;

  return (
    <div className="space-y-4">
      {/* Agregar miembro */}
      {isOwner && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

          {/* Toggle modo */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-5">
            <button
              onClick={() => { setMode("invite"); setError(null); setSuccess(null); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${mode === "invite" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              ✉️ Invitar por email
            </button>
            <button
              onClick={() => { setMode("create"); setError(null); setSuccess(null); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${mode === "create" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              👤 Crear usuario
            </button>
          </div>

          <p className="text-sm text-gray-400 mb-4">
            {mode === "invite"
              ? "El usuario recibirá un email para crear su contraseña y acceder al admin."
              : "Creas el usuario con contraseña desde acá — puede iniciar sesión de inmediato."}
          </p>

          {error   && <div className="mb-3 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">{error}</div>}
          {success && <div className="mb-3 p-3 bg-green-50 border border-green-100 rounded-lg text-sm text-green-700">{success}</div>}

          <div className="space-y-3">
            {/* Email */}
            <div className="flex gap-3">
              <input
                type="email"
                name="new-member-email"
                autoComplete="off"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <div className="relative">
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="h-full border border-gray-200 rounded-lg pl-3 pr-8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none bg-white"
                >
                  <option value="cajero">Cajero</option>
                  <option value="admin">Gerente</option>
                  <option value="owner">Dueño</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Contraseña (solo en modo crear) */}
            {mode === "create" && (
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  name="new-member-password"
                  autoComplete="new-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Contraseña (mín. 6 caracteres)"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 pr-20"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-700 font-medium"
                >
                  {showPass ? "Ocultar" : "Ver"}
                </button>
              </div>
            )}

            {/* Botón */}
            <button
              onClick={submit}
              disabled={submitting || !email.trim() || (mode === "create" && !password.trim())}
              className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {submitting
                ? (mode === "invite" ? "Enviando..." : "Creando...")
                : (mode === "invite" ? "Enviar invitación" : "Crear usuario")}
            </button>
          </div>
        </div>
      )}

      {/* Lista de miembros */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Equipo actual</h2>
          <p className="text-xs text-gray-400 mt-0.5">{members.length} miembro{members.length !== 1 ? "s" : ""}</p>
        </div>

        {loading ? (
          <div className="px-6 py-10 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
          </div>
        ) : members.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-400 text-sm">Sin miembros todavía</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {members.map(member => {
              // El último dueño no se puede degradar ni eliminar (quedarías sin acceso)
              const isLastOwner = member.role === "owner" && ownerCount <= 1;
              const canManage   = isOwner && !isLastOwner;
              return (
              <div key={member.userId} className="px-6 py-4 flex items-center gap-4">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-brand-600">
                    {member.email[0].toUpperCase()}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{member.email}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Desde {new Date(member.createdAt).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>

                {/* Role selector o badge */}
                {canManage ? (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {savedRole === member.userId && (
                      <span className="text-xs text-green-600 font-medium">✓ Guardado</span>
                    )}
                    <div className="relative">
                      <select
                        value={pendingRoles[member.userId] ?? member.role}
                        onChange={e => selectRole(member.userId, e.target.value)}
                        disabled={savingRole === member.userId}
                        className={`border rounded-lg pl-2.5 pr-7 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none bg-white ${pendingRoles[member.userId] ? "border-brand-400" : "border-gray-200"}`}
                      >
                        <option value="cajero">Cajero</option>
                        <option value="admin">Gerente</option>
                        <option value="owner">Dueño</option>
                      </select>
                      <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    {pendingRoles[member.userId] && (
                      <>
                        <button
                          onClick={() => saveRole(member.userId)}
                          disabled={savingRole === member.userId}
                          title="Guardar cambio de rol"
                          className="flex items-center gap-1 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          {savingRole === member.userId
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Check className="w-3.5 h-3.5" />}
                          Guardar
                        </button>
                        <button
                          onClick={() => cancelRole(member.userId)}
                          disabled={savingRole === member.userId}
                          title="Descartar cambio"
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <RoleBadge role={member.role} />
                    {isLastOwner && <span className="text-[10px] text-gray-400">único dueño</span>}
                  </div>
                )}

                {/* Remove */}
                {canManage && (
                  <button
                    onClick={() => remove(member)}
                    disabled={removing === member.userId}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                  >
                    {removing === member.userId
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Trash2 className="w-4 h-4" />}
                  </button>
                )}
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Customers Tab ────────────────────────────────────────────────────────────

function CustomersTab({ storeId }: { storeId: string }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");

  useEffect(() => {
    fetch(`/api/customers?storeId=${storeId}`)
      .then(r => r.json())
      .then(data => { setCustomers(data); setLoading(false); });
  }, [storeId]);

  const filtered = customers.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold text-gray-900">Clientes registrados</h2>
          <p className="text-xs text-gray-400 mt-0.5">{customers.length} cliente{customers.length !== 1 ? "s" : ""}</p>
        </div>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre, email o teléfono..."
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-64"
        />
      </div>

      {loading ? (
        <div className="px-6 py-10 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
        </div>
      ) : customers.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-7 h-7 text-gray-400" />
          </div>
          <p className="font-semibold text-gray-700">Sin clientes todavía</p>
          <p className="text-sm text-gray-400 mt-1">
            Aparecerán aquí cuando se registren en la tienda
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="px-6 py-10 text-center text-gray-400 text-sm">
          Sin resultados para "{search}"
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {filtered.map(c => (
            <div key={c.userId} className="px-6 py-4 flex items-center gap-4">
              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-gray-500">
                  {(c.name !== "—" ? c.name : c.email)[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{c.name !== "—" ? c.name : c.email}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <p className="text-xs text-gray-400">{c.email}</p>
                  {c.phone !== "—" && <p className="text-xs text-gray-400">· {c.phone}</p>}
                </div>
              </div>
              <p className="text-xs text-gray-400 flex-shrink-0">
                {new Date(c.createdAt).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
