/**
 * Normaliza una fecha desde API (p. ej. "2025-02-01" o "2025-02-01T00:00:00.000Z")
 * a clave de día "yyyy-MM-dd" para agrupar y comparar sin zona horaria.
 */
export function toDateOnly(dateStr: string): string {
  if (!dateStr) return "";
  return dateStr.slice(0, 10);
}
