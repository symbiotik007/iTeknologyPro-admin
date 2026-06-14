// Horario automático de encendido/apagado de la tienda.
// El estado abierto/cerrado se calcula "en vivo" según la hora actual en la
// zona horaria del negocio — no hace falta cron ni job programado.

export type Schedule = {
  enabled: boolean;
  tz?: string;        // ej. "America/Bogota"
  open: string;       // "HH:MM"
  close: string;      // "HH:MM"
  days?: number[];    // 0=Dom .. 6=Sáb ; vacío/ausente = todos los días
};

const DEFAULT_TZ = "America/Bogota";

const toMins = (t: string): number => {
  const [h, m] = String(t ?? "").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

const localNow = (tz: string | undefined, now: Date): Date =>
  new Date(now.toLocaleString("en-US", { timeZone: tz || DEFAULT_TZ }));

// ¿Abierta ahora según el horario?  null = no hay horario automático activo.
export const isOpenBySchedule = (
  schedule: Schedule | null | undefined,
  now: Date = new Date(),
): boolean | null => {
  if (!schedule || !schedule.enabled) return null;

  const local = localNow(schedule.tz, now);
  const day   = local.getDay();
  const days  = Array.isArray(schedule.days) && schedule.days.length
    ? schedule.days
    : [0, 1, 2, 3, 4, 5, 6];

  if (!days.includes(day)) return false;

  const nowM   = local.getHours() * 60 + local.getMinutes();
  const openM  = toMins(schedule.open);
  const closeM = toMins(schedule.close);

  if (openM === closeM) return true;
  if (openM < closeM)   return nowM >= openM && nowM < closeM;
  return nowM >= openM || nowM < closeM;
};

// "paused" efectivo: si el horario está activo manda el horario; si no, el switch manual.
export const computePaused = (
  config: { paused?: boolean; schedule?: Schedule | null } | null | undefined,
  now: Date = new Date(),
): boolean => {
  const open = isOpenBySchedule(config?.schedule, now);
  if (open === null) return config?.paused === true;
  return !open;
};
