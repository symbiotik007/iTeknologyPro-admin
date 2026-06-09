"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, X, Loader2 } from "lucide-react";

const TOKEN   = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const BASE    = "https://api.mapbox.com/geocoding/v5/mapbox.places";
const PROX_CO = "-74.0721,4.7110"; // Colombia centro

interface Feature {
  id: string;
  text_es?: string;
  text?: string;
  place_name_es?: string;
  place_name?: string;
}

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  proximity?: string;
}

export default function AddressPicker({ value, onChange, placeholder = "Escribe la dirección...", proximity }: Props) {
  const PROX = proximity || PROX_CO;

  const [query, setQuery]           = useState(value);
  const [suggestions, setSuggestions] = useState<Feature[]>([]);
  const [open, setOpen]             = useState(false);
  const [loading, setLoading]       = useState(false);
  const [confirmed, setConfirmed]   = useState(!!value);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef  = useRef<HTMLDivElement>(null);

  // Sync si el valor externo cambia (ej: limpiar form)
  useEffect(() => {
    if (value !== query) { setQuery(value); setConfirmed(!!value); }
  }, [value]); // eslint-disable-line

  const geocode = useCallback(async (q: string) => {
    if (!TOKEN || q.trim().length < 3) { setSuggestions([]); return; }
    setLoading(true);
    try {
      const url = `${BASE}/${encodeURIComponent(q)}.json?access_token=${TOKEN}&country=co&language=es&types=address,neighborhood,place&proximity=${PROX}&limit=5`;
      const res  = await fetch(url);
      const data = await res.json();
      setSuggestions(data.features || []);
      setOpen(true);
    } catch { setSuggestions([]); }
    setLoading(false);
  }, [PROX]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    onChange(q);
    setConfirmed(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => geocode(q), 350);
  };

  const handleSelect = (f: Feature) => {
    const raw  = f.place_name_es || f.place_name || "";
    const addr = raw.replace(/, Colombia$/, "");
    setQuery(addr);
    onChange(addr);
    setSuggestions([]);
    setOpen(false);
    setConfirmed(true);
  };

  const handleBlur = () => {
    // El usuario escribió su dirección sin seleccionar — igual se acepta
    setTimeout(() => {
      if (query.trim()) { setConfirmed(true); setOpen(false); }
    }, 150);
  };

  const clear = () => { setQuery(""); onChange(""); setSuggestions([]); setConfirmed(false); };

  // Cerrar al click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <div className={`flex items-center border rounded-lg px-3 transition-all ${
        confirmed ? "border-green-400 ring-1 ring-green-200" : "border-gray-200 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20"
      }`}>
        <MapPin className={`w-4 h-4 flex-shrink-0 mr-2 ${confirmed ? "text-green-500" : "text-gray-400"}`} />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className="flex-1 py-2.5 text-sm bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
        />
        {loading && <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin flex-shrink-0" />}
        {query && !loading && (
          <button type="button" onClick={clear} className="text-gray-400 hover:text-gray-700 flex-shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {confirmed && query && (
        <p className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
          <MapPin className="w-3 h-3" /> Dirección confirmada
        </p>
      )}

      {open && suggestions.length > 0 && (
        <ul className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {suggestions.map(f => (
            <li
              key={f.id}
              onMouseDown={() => handleSelect(f)}
              className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors"
            >
              <MapPin className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800">{f.text_es || f.text}</p>
                <p className="text-xs text-gray-400 truncate">
                  {(f.place_name_es || f.place_name || "").replace(/, Colombia$/, "")}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
