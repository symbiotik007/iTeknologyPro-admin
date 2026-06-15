"use client";
import { useMemo, useState } from "react";
import {
  Wand2, ArrowRight, ArrowLeft, Check, Copy, ExternalLink, Loader2,
  Store, Palette, Phone, Sparkles, QrCode, Plus,
} from "lucide-react";
import { TEMPLATES, getTemplate } from "@/lib/storeTemplates";
import { buildPalette } from "@/lib/color";
import { slugify } from "@/lib/slug";

type Result = { ok: true; slug: string; name: string; demoUrl: string };

const STEPS = ["Plantilla", "Identidad", "Contacto", "¡Listo!"];
const money = (n: number) => "$ " + n.toLocaleString("es-CO");

export default function StoreMakerWizard({ storeUrl }: { storeUrl: string }) {
  const [step, setStep] = useState(0);
  const [templateKey, setTemplateKey] = useState("");
  const [name, setName] = useState("");
  const [primary, setPrimary] = useState("#2563EB");
  const [tagline, setTagline] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);

  const tpl = getTemplate(templateKey);
  const palette = useMemo(() => buildPalette(primary), [primary]);
  const slug = useMemo(() => slugify(name), [name]);
  const previewUrl = `${storeUrl}/t/${slug || "tu-tienda"}`;

  const canNext =
    (step === 0 && !!tpl) ||
    (step === 1 && name.trim().length >= 2) ||
    step === 2;

  const pickTemplate = (key: string) => {
    setTemplateKey(key);
    const t = getTemplate(key);
    if (t) { setPrimary(t.primary); if (!tagline) setTagline(t.tagline); }
  };

  const create = async () => {
    setCreating(true); setError(null);
    try {
      const res = await fetch("/api/store-maker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(), template: templateKey, primary, tagline,
          whatsapp, lead: { name: leadName.trim(), phone: leadPhone.trim() },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo crear la tienda");
      setResult(data); setStep(3);
    } catch (e: any) {
      setError(e.message);
    }
    setCreating(false);
  };

  const copy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.demoUrl);
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  };

  const reset = () => {
    setStep(0); setTemplateKey(""); setName(""); setPrimary("#2563EB");
    setTagline(""); setWhatsapp(""); setLeadName(""); setLeadPhone("");
    setResult(null); setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-brand-500 flex items-center justify-center">
            <Wand2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Store Maker</h1>
            <p className="text-sm text-gray-500">Crea una tienda demo en minutos para tu próximo cliente.</p>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-2 mb-6">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`flex items-center gap-2 ${i <= step ? "text-brand-600" : "text-gray-400"}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                  ${i < step ? "bg-brand-500 text-white" : i === step ? "bg-brand-100 text-brand-700 ring-2 ring-brand-500" : "bg-gray-200 text-gray-500"}`}>
                  {i < step ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span className="text-xs font-semibold hidden sm:block">{s}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 rounded ${i < step ? "bg-brand-500" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          {/* ── Panel del paso ── */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-7 min-h-[420px] flex flex-col">
            {/* PASO 0 — Plantilla */}
            {step === 0 && (
              <>
                <h2 className="font-bold text-gray-900 mb-1 flex items-center gap-2"><Sparkles className="w-4 h-4 text-brand-500" /> Elige una plantilla</h2>
                <p className="text-sm text-gray-500 mb-5">Arranca con un catálogo de muestra y personalízalo encima.</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {TEMPLATES.map((t) => (
                    <button key={t.key} onClick={() => pickTemplate(t.key)}
                      className={`text-left rounded-xl border-2 p-4 transition-all hover:shadow-md
                        ${templateKey === t.key ? "border-brand-500 ring-2 ring-brand-100" : "border-gray-200 hover:border-gray-300"}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{t.emoji}</span>
                        <span className="font-bold text-gray-900">{t.label}</span>
                        {templateKey === t.key && <Check className="w-4 h-4 text-brand-500 ml-auto" />}
                      </div>
                      <p className="text-xs text-gray-500 mb-3">{t.tagline}</p>
                      <div className="flex gap-1.5">
                        {t.products.slice(0, 4).map((p, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={i} src={p.img} alt="" className="w-12 h-12 rounded-lg object-cover" />
                        ))}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-2">{t.categories.length} categorías · {t.products.length} productos</p>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* PASO 1 — Identidad */}
            {step === 1 && (
              <>
                <h2 className="font-bold text-gray-900 mb-1 flex items-center gap-2"><Store className="w-4 h-4 text-brand-500" /> Identidad de la tienda</h2>
                <p className="text-sm text-gray-500 mb-5">Así verá el cliente su marca.</p>
                <div className="space-y-4">
                  <Field label="Nombre de la tienda">
                    <input value={name} onChange={(e) => setName(e.target.value)} autoFocus
                      placeholder="Ej: Burger House Cali"
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none text-sm" />
                    {name.trim().length >= 2 && (
                      <p className="text-xs text-gray-400 mt-1">Link: <span className="font-mono text-brand-600">{previewUrl}</span></p>
                    )}
                  </Field>
                  <Field label="Eslogan (opcional)">
                    <input value={tagline} onChange={(e) => setTagline(e.target.value)}
                      placeholder={tpl?.tagline || "Una frase corta y pegajosa"}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none text-sm" />
                  </Field>
                  <Field label="Color de marca">
                    <div className="flex items-center gap-3">
                      <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)}
                        className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5" />
                      <input value={primary} onChange={(e) => setPrimary(e.target.value)}
                        className="w-28 px-3 py-2.5 rounded-lg border border-gray-300 outline-none text-sm font-mono" />
                      <div className="flex gap-1.5">
                        {["#D4541A", "#2563EB", "#16A34A", "#DB2777", "#7C3AED", "#0891B2"].map((c) => (
                          <button key={c} onClick={() => setPrimary(c)} title={c}
                            className="w-7 h-7 rounded-full border-2 border-white shadow ring-1 ring-gray-200"
                            style={{ background: c }} />
                        ))}
                      </div>
                    </div>
                  </Field>
                </div>
              </>
            )}

            {/* PASO 2 — Contacto */}
            {step === 2 && (
              <>
                <h2 className="font-bold text-gray-900 mb-1 flex items-center gap-2"><Phone className="w-4 h-4 text-brand-500" /> Contacto y lead</h2>
                <p className="text-sm text-gray-500 mb-5">Opcional, pero ayuda a que la demo se sienta real y a recordar de quién es.</p>
                <div className="space-y-4">
                  <Field label="WhatsApp de la tienda (opcional)">
                    <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="573001112233"
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none text-sm" />
                  </Field>
                  <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Lead asociado (para tu seguimiento)</p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Field label="Nombre del cliente">
                        <input value={leadName} onChange={(e) => setLeadName(e.target.value)}
                          placeholder="Ej: Don Carlos"
                          className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none text-sm" />
                      </Field>
                      <Field label="Teléfono del cliente">
                        <input value={leadPhone} onChange={(e) => setLeadPhone(e.target.value)}
                          placeholder="3001112233"
                          className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none text-sm" />
                      </Field>
                    </div>
                  </div>
                  {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
                </div>
              </>
            )}

            {/* PASO 3 — Resultado */}
            {step === 3 && result && (
              <div className="flex flex-col items-center text-center justify-center flex-1">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <Check className="w-9 h-9 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">¡Tienda demo creada! 🎉</h2>
                <p className="text-sm text-gray-500 mb-5">«{result.name}» ya está en línea con su catálogo.</p>

                <div className="flex items-center gap-2 w-full max-w-md bg-gray-50 border border-gray-200 rounded-lg p-2 mb-3">
                  <span className="flex-1 text-sm font-mono text-gray-700 truncate px-2">{result.demoUrl}</span>
                  <button onClick={copy} className="flex items-center gap-1.5 text-xs font-semibold bg-white border border-gray-300 rounded-md px-3 py-2 hover:bg-gray-100">
                    {copied ? <><Check className="w-3.5 h-3.5 text-green-600" /> Copiado</> : <><Copy className="w-3.5 h-3.5" /> Copiar</>}
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
                  <a href={result.demoUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-lg px-4 py-2.5">
                    <ExternalLink className="w-4 h-4" /> Abrir tienda
                  </a>
                  <a href={`https://wa.me/?text=${encodeURIComponent(`Mira la demo de tu tienda online: ${result.demoUrl}`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg px-4 py-2.5">
                    <Phone className="w-4 h-4" /> Enviar por WhatsApp
                  </a>
                </div>

                <div className="flex flex-col items-center gap-2 mb-6">
                  <p className="text-xs text-gray-400 flex items-center gap-1"><QrCode className="w-3.5 h-3.5" /> Escanéalo para abrir en el celular</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="QR de la tienda" width={170} height={170} className="rounded-lg border border-gray-200"
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(result.demoUrl)}`} />
                </div>

                <button onClick={reset} className="flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700">
                  <Plus className="w-4 h-4" /> Crear otra tienda
                </button>
              </div>
            )}

            {/* Navegación */}
            {step < 3 && (
              <div className="flex items-center justify-between mt-auto pt-6">
                <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
                  className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-800 disabled:opacity-0">
                  <ArrowLeft className="w-4 h-4" /> Atrás
                </button>
                {step < 2 ? (
                  <button onClick={() => setStep((s) => s + 1)} disabled={!canNext}
                    className="flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white text-sm font-semibold rounded-lg px-5 py-2.5">
                    Continuar <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button onClick={create} disabled={creating}
                    className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-semibold rounded-lg px-5 py-2.5">
                    {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creando…</> : <><Wand2 className="w-4 h-4" /> Crear tienda demo</>}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── Preview en vivo (teléfono) ── */}
          <div className="hidden lg:block">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5"><Palette className="w-3.5 h-3.5" /> Vista previa</p>
            <div className="rounded-[2rem] border-[6px] border-gray-900 bg-white overflow-hidden shadow-xl">
              {/* Header de la tienda */}
              <div className="px-4 py-3 text-white" style={{ background: palette.primary }}>
                <p className="font-bold text-sm truncate">{name.trim() || tpl?.label || "Tu tienda"}</p>
                <p className="text-[11px] opacity-90 truncate">{tagline || tpl?.tagline || "Tu eslogan aquí"}</p>
              </div>
              {/* Cinta */}
              <div className="text-[10px] px-3 py-1.5 truncate" style={{ background: palette.primaryLight, color: palette.primaryDark }}>
                {tpl?.announcement || "🛍️ Bienvenido a tu nueva tienda online"}
              </div>
              {/* Grid de productos */}
              <div className="p-3 grid grid-cols-2 gap-2.5 bg-gray-50">
                {(tpl?.products || []).slice(0, 4).map((p, i) => (
                  <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.img} alt="" className="w-full h-20 object-cover" />
                    <div className="p-2">
                      <p className="text-[11px] font-semibold text-gray-800 truncate">{p.title}</p>
                      <p className="text-[11px] font-bold" style={{ color: palette.primary }}>{money(p.price)}</p>
                    </div>
                  </div>
                ))}
                {!tpl && (
                  <div className="col-span-2 text-center text-xs text-gray-400 py-10">Elige una plantilla para ver el preview</div>
                )}
              </div>
              {/* Botón ficticio */}
              <div className="p-3 bg-gray-50">
                <div className="rounded-lg py-2.5 text-center text-white text-xs font-bold" style={{ background: palette.primary }}>
                  Ver el menú
                </div>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 mt-2 text-center font-mono truncate">{previewUrl}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</span>
      {children}
    </label>
  );
}
