// Genera la paleta de marca (primaryLight/Med/Dark) a partir de un solo color
// primario, para que el vendedor solo elija UN color y la tienda quede coherente.

const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));

const toRgb = (hex: string): [number, number, number] => {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h || "2563eb", 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const toHex = (r: number, g: number, b: number) =>
  "#" + [r, g, b].map((v) => clamp(v).toString(16).padStart(2, "0")).join("");

// mix hacia blanco (amt 0..1)
const lighten = (hex: string, amt: number) => {
  const [r, g, b] = toRgb(hex);
  return toHex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt);
};

// mix hacia negro (amt 0..1)
const darken = (hex: string, amt: number) => {
  const [r, g, b] = toRgb(hex);
  return toHex(r * (1 - amt), g * (1 - amt), b * (1 - amt));
};

export const buildPalette = (primary: string) => ({
  primary,
  primaryLight: lighten(primary, 0.9),
  primaryMed:   lighten(primary, 0.45),
  primaryDark:  darken(primary, 0.18),
  accent: "#f59e0b",
});

// valida un hex tipo #RRGGBB o #RGB
export const isHexColor = (s: string) => /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test((s || "").trim());
