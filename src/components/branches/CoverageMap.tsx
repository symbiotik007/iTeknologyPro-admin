"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapPin, Crosshair, Search, Undo2, Trash2, Circle, Pentagon } from "lucide-react";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const GEOCODE = "https://api.mapbox.com/geocoding/v5/mapbox.places";
const CALI = { lat: 3.4516, lng: -76.5320 };

export type Coverage =
  | { type: "radius";  km: number }
  | { type: "polygon"; coordinates: number[][] };   // [[lng,lat], ...]
export type CoverageValue = { lat: number; lng: number; coverage: Coverage };

// ── helpers geométricos (sin dependencias) ───────────────────────────────────
const circleRing = (lat: number, lng: number, km: number, n = 64): number[][] => {
  const dLat = km / 110.574;
  const dLng = km / (111.320 * Math.cos((lat * Math.PI) / 180));
  const ring: number[][] = [];
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * 2 * Math.PI;
    ring.push([lng + dLng * Math.cos(t), lat + dLat * Math.sin(t)]);
  }
  return ring;
};
const fc = (features: object[]) => ({ type: "FeatureCollection" as const, features });
const circleGeoJSON = (lat: number, lng: number, km: number) =>
  fc([{ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [circleRing(lat, lng, km)] } }]);
const polyGeoJSON = (verts: number[][]) => {
  if (verts.length >= 3)
    return fc([{ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [[...verts, verts[0]]] } }]);
  if (verts.length === 2)
    return fc([{ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: verts } }]);
  return fc([]);
};
const centroid = (verts: number[][]) => {
  const n = verts.length || 1;
  const s = verts.reduce((a, v) => [a[0] + v[0], a[1] + v[1]], [0, 0]);
  return { lng: s[0] / n, lat: s[1] / n };
};

export default function CoverageMap({
  lat, lng, coverage, address, onChange,
}: {
  lat?: number | null;
  lng?: number | null;
  coverage?: Coverage | null;
  address?: string;
  onChange: (v: CoverageValue) => void;
}) {
  const elRef     = useRef<HTMLDivElement>(null);
  const mapRef    = useRef<mapboxgl.Map | null>(null);
  const centerRef = useRef<mapboxgl.Marker | null>(null);
  const vertRefs  = useRef<mapboxgl.Marker[]>([]);
  const loadedRef = useRef(false);

  const [mode, setMode]   = useState<"radius" | "polygon">(coverage?.type === "polygon" ? "polygon" : "radius");
  const [km, setKm]       = useState<number>(coverage?.type === "radius" ? coverage.km : 3);
  const [center, setCenter] = useState({ lat: lat ?? CALI.lat, lng: lng ?? CALI.lng });
  const [verts, setVerts] = useState<number[][]>(coverage?.type === "polygon" ? coverage.coordinates : []);

  // refs vivos para usar dentro de los listeners del mapa
  const modeRef  = useRef(mode);  modeRef.current  = mode;
  const vertsRef = useRef(verts); vertsRef.current = verts;
  const kmRef    = useRef(km);    kmRef.current    = km;
  const onChangeRef = useRef(onChange); onChangeRef.current = onChange;

  // ── emite el valor según el modo ───────────────────────────────────────────
  const emit = useCallback((m: "radius" | "polygon", c: { lat: number; lng: number }, r: number, vs: number[][]) => {
    if (m === "radius") onChangeRef.current({ lat: c.lat, lng: c.lng, coverage: { type: "radius", km: r } });
    else {
      const ce = vs.length ? centroid(vs) : c;
      onChangeRef.current({ lat: ce.lat, lng: ce.lng, coverage: { type: "polygon", coordinates: vs } });
    }
  }, []);

  // ── pinta las capas según el modo ──────────────────────────────────────────
  const paint = useCallback((m: "radius" | "polygon", c: { lat: number; lng: number }, r: number, vs: number[][]) => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    (map.getSource("circle") as mapboxgl.GeoJSONSource | undefined)
      ?.setData((m === "radius" ? circleGeoJSON(c.lat, c.lng, r) : fc([])) as never);
    (map.getSource("poly") as mapboxgl.GeoJSONSource | undefined)
      ?.setData((m === "polygon" ? polyGeoJSON(vs) : fc([])) as never);
  }, []);

  // ── marcadores de vértices (polígono) ──────────────────────────────────────
  const clearVertMarkers = () => { vertRefs.current.forEach(mk => mk.remove()); vertRefs.current = []; };
  const renderVertMarkers = useCallback(() => {
    const map = mapRef.current; if (!map) return;
    clearVertMarkers();
    if (modeRef.current !== "polygon") return;
    vertsRef.current.forEach(([lngV, latV], i) => {
      const el = document.createElement("div");
      el.style.cssText = "width:14px;height:14px;border-radius:50%;background:#16a34a;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.4);cursor:grab;";
      const mk = new mapboxgl.Marker({ element: el, draggable: true }).setLngLat([lngV, latV]).addTo(map);
      mk.on("drag", () => {
        const ll = mk.getLngLat();
        const next = vertsRef.current.map((v, j) => (j === i ? [ll.lng, ll.lat] : v));
        vertsRef.current = next;
        paint("polygon", center, kmRef.current, next);
      });
      mk.on("dragend", () => { setVerts([...vertsRef.current]); emit("polygon", center, kmRef.current, vertsRef.current); });
      vertRefs.current.push(mk);
    });
  }, [paint, emit, center]);

  // ── init del mapa ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!TOKEN || !elRef.current || mapRef.current) return;
    mapboxgl.accessToken = TOKEN;
    const map = new mapboxgl.Map({
      container: elRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [center.lng, center.lat],
      zoom: 13,
      attributionControl: false,
    });
    mapRef.current = map;

    // marcador del centro (radio)
    const cm = new mapboxgl.Marker({ draggable: true, color: "#ef4444" }).setLngLat([center.lng, center.lat]);
    centerRef.current = cm;
    cm.on("dragend", () => {
      const ll = cm.getLngLat(); const p = { lat: ll.lat, lng: ll.lng };
      setCenter(p); paint("radius", p, kmRef.current, vertsRef.current); emit("radius", p, kmRef.current, vertsRef.current);
    });

    map.on("load", () => {
      loadedRef.current = true;
      map.addSource("circle", { type: "geojson", data: fc([]) as never });
      map.addSource("poly",   { type: "geojson", data: fc([]) as never });
      map.addLayer({ id: "circle-fill", type: "fill", source: "circle", paint: { "fill-color": "#22c55e", "fill-opacity": 0.15 } });
      map.addLayer({ id: "circle-line", type: "line", source: "circle", paint: { "line-color": "#16a34a", "line-width": 2 } });
      map.addLayer({ id: "poly-fill", type: "fill", source: "poly", paint: { "fill-color": "#22c55e", "fill-opacity": 0.18 } });
      map.addLayer({ id: "poly-line", type: "line", source: "poly", paint: { "line-color": "#16a34a", "line-width": 2 } });
      if (modeRef.current === "radius") cm.addTo(map);
      paint(modeRef.current, center, kmRef.current, vertsRef.current);
      renderVertMarkers();
    });

    // click en el mapa → agrega vértice (solo en modo polígono)
    map.on("click", (e) => {
      if (modeRef.current !== "polygon") return;
      const next = [...vertsRef.current, [e.lngLat.lng, e.lngLat.lat]];
      vertsRef.current = next;
      setVerts(next);
      renderVertMarkers();
      paint("polygon", center, kmRef.current, next);
      emit("polygon", center, kmRef.current, next);
    });

    return () => { clearVertMarkers(); map.remove(); mapRef.current = null; centerRef.current = null; loadedRef.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── cambio de modo ─────────────────────────────────────────────────────────
  const switchMode = (m: "radius" | "polygon") => {
    if (m === mode) return;
    setMode(m); modeRef.current = m;
    const map = mapRef.current;
    if (map && centerRef.current) {
      if (m === "radius") centerRef.current.addTo(map); else centerRef.current.remove();
    }
    renderVertMarkers();
    paint(m, center, kmRef.current, vertsRef.current);
    emit(m, center, kmRef.current, vertsRef.current);
  };

  const onSlider = (v: number) => { setKm(v); kmRef.current = v; paint("radius", center, v, vertsRef.current); emit("radius", center, v, vertsRef.current); };

  const recenter = (p: { lat: number; lng: number }) => {
    setCenter(p);
    centerRef.current?.setLngLat([p.lng, p.lat]);
    mapRef.current?.flyTo({ center: [p.lng, p.lat], zoom: 14 });
    if (modeRef.current === "radius") { paint("radius", p, kmRef.current, vertsRef.current); emit("radius", p, kmRef.current, vertsRef.current); }
  };

  const useGPS = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => recenter({ lat: coords.latitude, lng: coords.longitude }),
      () => {}, { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const geocodeAddress = async () => {
    if (!TOKEN || !address?.trim()) return;
    try {
      const url = `${GEOCODE}/${encodeURIComponent(address)}.json?access_token=${TOKEN}&country=co&language=es&limit=1`;
      const data = await (await fetch(url)).json();
      const c = data.features?.[0]?.center;
      if (Array.isArray(c)) recenter({ lng: c[0], lat: c[1] });
    } catch { /* silent */ }
  };

  const undoVertex = () => {
    const next = vertsRef.current.slice(0, -1);
    vertsRef.current = next; setVerts(next);
    renderVertMarkers(); paint("polygon", center, kmRef.current, next); emit("polygon", center, kmRef.current, next);
  };
  const clearVertices = () => {
    vertsRef.current = []; setVerts([]);
    renderVertMarkers(); paint("polygon", center, kmRef.current, []); emit("polygon", center, kmRef.current, []);
  };

  if (!TOKEN) {
    return <p className="text-sm text-gray-400">No hay token de mapa configurado (NEXT_PUBLIC_MAPBOX_TOKEN).</p>;
  }

  const Tab = ({ m, icon: Icon, label }: { m: "radius" | "polygon"; icon: typeof Circle; label: string }) => (
    <button type="button" onClick={() => switchMode(m)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
        mode === m ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
      <Icon className="w-3.5 h-3.5" /> {label}
    </button>
  );

  return (
    <div className="space-y-3">
      {/* Toggle de modo */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <Tab m="radius"  icon={Circle}  label="Radio" />
        <Tab m="polygon" icon={Pentagon} label="Polígono" />
      </div>

      <div className="relative">
        <div ref={elRef} className="w-full h-64 rounded-xl overflow-hidden border border-gray-200" />
        <div className="absolute top-2 right-2 flex flex-col gap-2 z-10">
          <button type="button" onClick={useGPS} title="Usar mi ubicación"
            className="w-9 h-9 bg-white rounded-lg shadow flex items-center justify-center text-brand-600 hover:bg-gray-50">
            <Crosshair className="w-4 h-4" />
          </button>
          {address?.trim() && (
            <button type="button" onClick={geocodeAddress} title="Ubicar por la dirección escrita"
              className="w-9 h-9 bg-white rounded-lg shadow flex items-center justify-center text-brand-600 hover:bg-gray-50">
              <Search className="w-4 h-4" />
            </button>
          )}
        </div>
        {/* Controles de polígono */}
        {mode === "polygon" && (
          <div className="absolute bottom-2 left-2 flex gap-2 z-10">
            <button type="button" onClick={undoVertex} disabled={!verts.length} title="Quitar último punto"
              className="flex items-center gap-1 bg-white rounded-lg shadow px-2.5 py-1.5 text-xs font-semibold text-gray-700 disabled:opacity-40">
              <Undo2 className="w-3.5 h-3.5" /> Deshacer
            </button>
            <button type="button" onClick={clearVertices} disabled={!verts.length} title="Borrar zona"
              className="flex items-center gap-1 bg-white rounded-lg shadow px-2.5 py-1.5 text-xs font-semibold text-red-600 disabled:opacity-40">
              <Trash2 className="w-3.5 h-3.5" /> Limpiar
            </button>
          </div>
        )}
      </div>

      {mode === "radius" ? (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-brand-500" /> Radio de cobertura
            </label>
            <span className="text-sm font-bold text-brand-600">{km} km</span>
          </div>
          <input type="range" min={0.5} max={20} step={0.5} value={km}
            onChange={e => onSlider(parseFloat(e.target.value))} className="w-full accent-brand-500" />
          <p className="text-xs text-gray-400 mt-1">
            Arrastra el marcador rojo hasta la sede y ajusta el radio. Los pedidos fuera de la zona se rechazan.
          </p>
        </div>
      ) : (
        <p className="text-xs text-gray-400">
          Toca el mapa para ir marcando el contorno de tu zona. Arrastra los puntos verdes para ajustarlo.
          {" "}
          <span className={verts.length >= 3 ? "text-green-600 font-semibold" : "text-amber-600 font-semibold"}>
            {verts.length} punto{verts.length !== 1 ? "s" : ""}{verts.length < 3 ? " (mínimo 3)" : " ✓"}
          </span>
        </p>
      )}
    </div>
  );
}
