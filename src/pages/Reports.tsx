import { useEffect, useState, type ReactElement } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { products, sales, archiveApi } from "../lib/api";

import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { formatCurrency, formatDate } from "../lib/format";

type ServerProduct = {
  id: number;
  nombre: string;
  precio_venta: number;
  costo_unitario: number;
  stock: number;
};

type MetricPoint = {
  period: string;
  ingresos: number;
  ganancia: number;
  items: number;
};

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** retorna el lunes ISO de la semana `week` del `year` */
function getDateOfISOWeek(week: number, year: number) {
  const jan4 = new Date(year, 0, 4);
  const day = jan4.getDay() === 0 ? 7 : jan4.getDay(); // 1..7 (Mon..Sun)
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() + (week - 1) * 7 - (day - 1));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/** formatea el label del periodo:
    - week: devuelve "dd/mm/yyyy — dd/mm/yyyy"
    - day: devuelve "dd/mm/yyyy" o "desde — hasta" si viene rango
    - month: devuelve "MMM YYYY" si es "YYYY-MM" o el valor raw */
function formatPeriodLabel(periodStr: string, periodType: "day" | "week" | "month") {
  if (!periodStr) return periodStr;

  if (periodType === "week") {
    // soporta formatos comunes: "W35", "35", "2025-W35", "2025-35", "2025-W35-extra"
    const yWMatch = periodStr.match(/(\d{4})[^\d]*W?(\d{1,2})/i);
    let year = new Date().getFullYear();
    let week: number | null = null;
    if (yWMatch) {
      year = Number(yWMatch[1]);
      week = Number(yWMatch[2]);
    } else {
      const wMatch = periodStr.match(/W?(\d{1,2})/i);
      if (wMatch) week = Number(wMatch[1]);
    }
    if (week == null) return periodStr;
    try {
      const start = getDateOfISOWeek(week, year);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return `${formatDate(start)} — ${formatDate(end)}`;
    } catch {
      return periodStr;
    }
  }

  if (periodType === "day") {
    // si es YYYY-MM-DD
    const dMatch = periodStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dMatch) {
      const d = new Date(periodStr);
      return formatDate(d, undefined);
    }
    // si es rango "YYYY-MM-DD_to_YYYY-MM-DD" o "YYYY-MM-DD/YYY..."
    const rangeMatch = periodStr.match(/(\d{4}-\d{2}-\d{2}).*?(\d{4}-\d{2}-\d{2})/);
    if (rangeMatch) {
      const a = new Date(rangeMatch[1]);
      const b = new Date(rangeMatch[2]);
      return `${formatDate(a)} — ${formatDate(b)}`;
    }
    return periodStr;
  }

  if (periodType === "month") {
    // formatos "YYYY-MM" o "YYYY-M"
    const mMatch = periodStr.match(/^(\d{4})-(\d{1,2})$/);
    if (mMatch) {
      const y = Number(mMatch[1]);
      const m = Number(mMatch[2]) - 1;
      const d = new Date(y, m, 1);
      return formatDate(d, { month: "long", year: "numeric" });
    }
  }

  return periodStr;
}

export default function Reports(): ReactElement {
  const [filtro, setFiltro] = useState<"hoy" | "semana" | "mes">("hoy");
  const [dayRange, setDayRange] = useState<number>(1); // 1,7,14,21,28
  const [weekRange, setWeekRange] = useState<number>(1); // 1..8 (max 2 meses)
  const [productsList, setProductsList] = useState<ServerProduct[]>([]);
  const [salesList, setSalesList] = useState<any[]>([]);
  const [metricsSeries, setMetricsSeries] = useState<MetricPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = async () => {
    try {
      const p = await products.list();
      setProductsList(Array.isArray(p) ? p : []);
    } catch (err) {
      console.error("loadProducts", err);
      setProductsList([]);
    }
  };

  const loadCurrentSales = async () => {
    try {
      const s = await sales.list();
      setSalesList(Array.isArray(s) ? s : []);
    } catch (err) {
      console.error("loadCurrentSales", err);
      setSalesList([]);
    }
  };

  const loadMetricsSeries = async (period: "day" | "week" | "month", last: number) => {
    try {
      const ms = await archiveApi.metricsSeries(period, last);
      setMetricsSeries(Array.isArray(ms) ? ms : []);
    } catch (err) {
      console.error("loadMetricsSeries", err);
      setMetricsSeries([]);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      await loadProducts();

      if (filtro === "hoy") {
        if (dayRange === 1) {
          // hoy: usar ventas crudas
          await loadCurrentSales();
          setMetricsSeries([]);
        } else {
          // últimos N días (agregado por day)
          await loadMetricsSeries("day", dayRange);
          await loadCurrentSales(); // mantener ventas actuales en caso de necesitar detalle
        }
      } else if (filtro === "semana") {
        // semanas: limit weeks to 8 (2 months)
        const lastWeeks = Math.min(Math.max(1, weekRange), 8);
        await loadMetricsSeries("week", lastWeeks);
        await loadCurrentSales();
      } else {
        // mes -> mantener 6 meses por defecto
        await loadMetricsSeries("month", 6);
        await loadCurrentSales();
      }
    } catch (err: any) {
      console.error("loadAll", err);
      setError(String(err?.message ?? err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtro, dayRange, weekRange]);

  // Helpers para cálculo en modo "hoy" usando salesList + productsList
  const productsById = new Map<number, ServerProduct>();
  productsList.forEach((p) => productsById.set(p.id, p));

  let ingresosCostos: { label: string; ingresos: number; costos: number }[] = [];
  let gananciaNeta: { label: string; ganancia: number }[] = [];
  let tableResumen: { label: string; ingresos: number; costos: number; ganancia: number }[] = [];

  // Determina el tipo de periodo para formateo de labels
  const periodType: "day" | "week" | "month" =
    filtro === "semana" ? "week" : filtro === "mes" ? "month" : "day";

  if (filtro === "hoy" && dayRange === 1) {
    const start = startOfDay(new Date()).getTime();
    const ventasHoy = salesList.filter((s) => {
      try {
        return new Date(s.hora).getTime() >= start;
      } catch {
        return false;
      }
    });
    const ingresos = ventasHoy.reduce((acc, s) => acc + Number(s.total || 0), 0);
    const costos = ventasHoy.reduce((acc, s) => {
      const prod = productsById.get(s.producto_id);
      return acc + (prod ? prod.costo_unitario * (s.cantidad || 0) : 0);
    }, 0);
    ingresosCostos = [{ label: "Hoy", ingresos: Number(ingresos.toFixed(2)), costos: Number(costos.toFixed(2)) }];
    gananciaNeta = [{ label: "Hoy", ganancia: Number((ingresos - costos).toFixed(2)) }];
    tableResumen = [{ label: "Hoy", ingresos: ingresosCostos[0].ingresos, costos: ingresosCostos[0].costos, ganancia: gananciaNeta[0].ganancia }];
  } else {
    // Usamos metricsSeries (basado en batches) para day/week/month
    ingresosCostos = metricsSeries.map((m) => ({
      label: formatPeriodLabel(String(m.period ?? ""), periodType),
      ingresos: Number(m.ingresos || 0),
      costos: Number((m.ingresos - m.ganancia) || 0),
    }));
    gananciaNeta = metricsSeries.map((m) => ({ label: formatPeriodLabel(String(m.period ?? ""), periodType), ganancia: Number(m.ganancia || 0) }));
    tableResumen = metricsSeries.map((m) => ({
      label: formatPeriodLabel(String(m.period ?? ""), periodType),
      ingresos: Number(m.ingresos || 0),
      costos: Number((m.ingresos - m.ganancia) || 0),
      ganancia: Number(m.ganancia || 0),
    }));
  }

  const exportCsv = () => {
    if (!tableResumen || tableResumen.length === 0) return;
    const header = ["periodo", "ingresos", "costos", "ganancia"];
    const rows = [header.join(",")].concat(
      tableResumen.map((r) => [r.label, r.ingresos.toFixed(2), r.costos.toFixed(2), r.ganancia.toFixed(2)].join(","))
    );
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reports_${filtro}_${filtro === "hoy" ? `d${dayRange}` : filtro}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = async () => {
    if (!tableResumen || tableResumen.length === 0) return;
    try {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Report");
      ws.addRow(["Periodo", "Ingresos", "Costos", "Ganancia"]);
      tableResumen.forEach((r) => {
        ws.addRow([r.label, Number(r.ingresos).toFixed(2), Number(r.costos).toFixed(2), Number(r.ganancia).toFixed(2)]);
      });
      ws.columns = [
        { width: 40 },
        { width: 15 },
        { width: 15 },
        { width: 15 },
      ];
      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const filename = `reports_${filtro}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      saveAs(blob, filename);
    } catch (err) {
      console.error("exportExcel failed", err);
      alert("Error al generar Excel. Revisa la consola.");
    }
  };

  return (
    <div className="min-h-screen bg-yellow-400 flex justify-center items-start py-12 px-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl p-10 flex flex-col gap-8">
        <h2 className="text-3xl font-bold text-yellow-600 text-center flex items-center gap-2">
          <span>📈</span> Reportes
        </h2>

        <div className="flex flex-wrap gap-2 mb-6 items-center">
          {/* modo: botones con clases Tailwind explícitas para no depender de DaisyUI */}
          <button
            onClick={() => setFiltro("hoy")}
            className={`px-3 py-1 rounded-md ${filtro === "hoy" ? "bg-yellow-500 text-white" : "border border-gray-300 bg-white text-gray-800"}`}
          >
            Hoy
          </button>
          <button
            onClick={() => setFiltro("semana")}
            className={`px-3 py-1 rounded-md ${filtro === "semana" ? "bg-yellow-500 text-white" : "border border-gray-300 bg-white text-gray-800"}`}
          >
            Semana
          </button>
          <button
            onClick={() => setFiltro("mes")}
            className={`px-3 py-1 rounded-md ${filtro === "mes" ? "bg-yellow-500 text-white" : "border border-gray-300 bg-white text-gray-800"}`}
          >
            Mes
          </button>

          <div className="ml-auto flex items-center gap-3">
            {/* Day range selector (aparece cuando se selecciona 'hoy') */}
            {filtro === "hoy" && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Rango días</label>
                <select
                  value={dayRange}
                  onChange={(e) => setDayRange(Number(e.target.value))}
                  className="px-2 py-1 border rounded-md"
                >
                  <option value={1}>Hoy</option>
                  <option value={7}>Últimos 7 días</option>
                  <option value={14}>Últimos 14 días</option>
                  <option value={21}>Últimos 21 días</option>
                  <option value={28}>Últimos 28 días</option>
                </select>
              </div>
            )}

            {filtro === "semana" && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Últimas semanas</label>
                <select
                  value={weekRange}
                  onChange={(e) => setWeekRange(Number(e.target.value))}
                  className="px-2 py-1 border rounded-md"
                >
                  {Array.from({ length: 8 }).map((_, i) => {
                    const v = i + 1;
                    return <option key={v} value={v}>{v} semana{v > 1 ? "s" : ""}</option>;
                  })}
                </select>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={exportCsv} disabled={tableResumen.length === 0} className="px-3 py-1 border rounded-md bg-white hover:bg-gray-50 disabled:opacity-50">
                CSV
              </button>
              <button onClick={exportExcel} disabled={tableResumen.length === 0} className="px-3 py-1 bg-yellow-500 text-white rounded-md disabled:opacity-50">
                Excel
              </button>
            </div>
          </div>
        </div>

        {loading && <div className="text-center text-gray-600">Cargando datos...</div>}
        {error && <div className="text-center text-red-600">Error: {error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-blue-50 rounded-xl p-6 shadow flex flex-col items-center">
            <h3 className="font-semibold mb-2 text-gray-700">Ingresos vs Costos</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ingresosCostos}>
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="ingresos" fill="#2563eb" name="Ingresos" />
                <Bar dataKey="costos" fill="#f59e42" name="Costos" />
                <CartesianGrid stroke="#eee" strokeDasharray="4 4" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-green-50 rounded-xl p-6 shadow flex flex-col items-center">
            <h3 className="font-semibold mb-2 text-gray-700">Ganancia neta</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={gananciaNeta}>
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="ganancia" stroke="#22c55e" strokeWidth={2} />
                <CartesianGrid stroke="#eee" strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-xl shadow">
            <thead>
              <tr className="bg-blue-50">
                <th className="py-3 px-4 text-left font-semibold text-gray-700">Periodo</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-700">Ingresos</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-700">Costos</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-700">Ganancia</th>
              </tr>
            </thead>
            <tbody>
              {tableResumen.length > 0 ? (
                tableResumen.map((row) => (
                  <tr key={row.label} className="border-b">
                    <td className="py-2 px-4">{row.label}</td>
                    <td className="py-2 px-4">{formatCurrency(row.ingresos)}</td>
                    <td className="py-2 px-4">{formatCurrency(row.costos)}</td>
                    <td className="py-2 px-4">{formatCurrency(row.ganancia)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center text-gray-400">Sin datos</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}