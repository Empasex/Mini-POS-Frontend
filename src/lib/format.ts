export function formatCurrency(
  value: number,
  locale = "es-PE",
  currency = "PEN"
): string {
  if (value == null || Number.isNaN(Number(value))) return "";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

export function formatDate(
  dateStr: string | Date | undefined | null,
  options?: Intl.DateTimeFormatOptions,
  locale = undefined // undefined = usar locale del navegador
): string {
  if (!dateStr) return "";
  // normalizar strings devueltos por el backend como "YYYY-MM-DD HH:MM:SS(.ffffff)"
  let iso = typeof dateStr === "string" ? dateStr.trim() : "";
  if (typeof dateStr !== "string") {
    // ya es Date
    return (dateStr as Date).toLocaleString(locale, options);
  }
  // si ya contiene timezone/Z o 'T' con offset, dejarlo
  if (!/T/.test(iso)) {
    iso = iso.replace(" ", "T");
  }
  // Si no tiene zona (no termina en Z ni tiene +hh), asumimos UTC y añadimos Z
  if (!/[zZ]|[+\-]\d{2}:\d{2}$/.test(iso)) {
    iso = iso + "Z";
  }
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleString(locale, options);
}