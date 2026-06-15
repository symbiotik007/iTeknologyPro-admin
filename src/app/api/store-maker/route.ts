import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getTemplate } from "@/lib/storeTemplates";
import { buildPalette, isHexColor } from "@/lib/color";
import { slugify } from "@/lib/slug";
import { demoLink } from "@/lib/storeUrl";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

// Encuentra un slug libre: base, base-2, base-3, …
async function uniqueSlug(svc: ReturnType<typeof createServiceClient>, base: string) {
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    const { data } = await svc.from("stores").select("id").eq("id", candidate).maybeSingle();
    if (!data) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export async function POST(req: NextRequest) {
  try {
    // 1) Vendedor autenticado (sesión por cookies) — se vincula como dueño de la demo
    const auth = createClient();
    const { data: { user } } = await auth.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const body = await req.json();
    const name = (body.name || "").trim();
    const tpl  = getTemplate(body.template);

    if (!name)  return NextResponse.json({ error: "Falta el nombre de la tienda" }, { status: 400 });
    if (!tpl)   return NextResponse.json({ error: "Plantilla inválida" }, { status: 400 });

    const primary = isHexColor(body.primary) ? (body.primary.startsWith("#") ? body.primary : `#${body.primary}`) : tpl.primary;
    const svc = createServiceClient();
    const slug = await uniqueSlug(svc, slugify(name));

    // 2) Config de marca que leerá el storefront (StoreContext la hidrata)
    const config = {
      name,
      tagline:        (body.tagline || tpl.tagline) || "",
      logoUrl:        body.logoUrl || null,
      locale:         "es-CO",
      currency:       "COP",
      currencySymbol: tpl.currencySymbol,
      theme:          { colors: buildPalette(primary), fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", borderRadius: "8px" },
      contact: {
        whatsapp:  (body.whatsapp || "").replace(/[^0-9]/g, "") || null,
        phone:     body.phone || null,
        proximity: body.proximity || "-76.5320,3.4516",
      },
      social: {},
      announcement: tpl.announcement,
      delivery: { fee: 0, freeAbove: null },
      catalog: {
        slider: tpl.slider,
        categoryLabels: Object.fromEntries(tpl.categories.map((c) => [c.cat, c.title])),
      },
    };

    // 3) Crear la tienda (demo) + vincular al vendedor + sembrar catálogo
    const { error: storeErr } = await svc.from("stores").insert({
      id:         slug,
      name,
      active:     true,
      is_demo:    true,
      created_by: user.id,
      lead:       body.lead?.name || body.lead?.phone ? body.lead : null,
      config,
    });
    if (storeErr) throw storeErr;

    // dueño = el vendedor (para que la demo aparezca en su switcher de tiendas)
    const { error: suErr } = await svc.from("store_users").insert({
      store_id: slug, user_id: user.id, role: "owner",
    });
    if (suErr) console.warn("[store-maker] store_users:", suErr.message);

    const categories = tpl.categories.map((c) => ({
      store_id: slug, title: c.title, cat: c.cat, img: c.img, sort_order: c.sort_order,
    }));
    const { error: catErr } = await svc.from("categories").insert(categories);
    if (catErr) throw catErr;

    const products = tpl.products.map((p) => ({
      store_id: slug, title: p.title, description: p.description, price: p.price,
      cat: p.cat, img: p.img, active: true, sort_order: p.sort_order,
    }));
    const { error: prodErr } = await svc.from("products").insert(products);
    if (prodErr) throw prodErr;

    // 4) Refresca el switcher de tiendas del admin
    revalidateTag("store-context");

    return NextResponse.json({ ok: true, slug, name, demoUrl: demoLink(slug) }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/store-maker]", err);
    return NextResponse.json({ error: err?.message || "Error interno" }, { status: 500 });
  }
}
