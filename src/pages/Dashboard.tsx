import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";
import { products } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { formatCurrency, formatDate } from "../lib/format";
import { BASE_API_URL } from "../lib/api";


// ...existing code...

type ServerProduct = {
  id: number;
  nombre: string;
  precio_venta: number;
  costo_unitario: number;
  stock: number;
};

type ServerSale = {
  id: number;
  producto_id: number;
  nombre: string;
  cantidad: number;
  total: number;
  hora: string;
};

const baseURL = BASE_API_URL;
const STOCK_ALERT_THRESHOLD = 5;

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function Dashboard() {
  const [productsList, setProductsList] = useState<ServerProduct[]>([]);
  const [salesList, setSalesList] = useState<ServerSale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // auth role (no other logic changed)
  const { role } = useAuth();

  const loadSalesFromApi = async (): Promise<ServerSale[]> => {
    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${baseURL}/sales/`, { headers });
      if (!res.ok) {
        // log para debugging
        console.error("sales fetch failed", res.status, await res.text());
        throw new Error(`sales fetch failed: ${res.status}`);
      }
      const data = (await res.json()) as ServerSale[];
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, s] = await Promise.all([products.list(), loadSalesFromApi()]);
      const prodArr: ServerProduct[] = Array.isArray(p) ? p : [];
      setProductsList(prodArr);
      setSalesList(s);
    } catch (err: any) {
      console.error("Dashboard load failed", err);
      setError(String(err?.message ?? err));
      setProductsList([]);
      setSalesList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Derived metrics
  const todayStart = startOfDay(new Date());
  const ventasHoy = salesList
    .filter((s) => {
      try {
        return new Date(s.hora) >= todayStart;
      } catch {
        return false;
      }
    })
    .reduce((acc, s) => acc + Number(s.total), 0);

  // Profit: (precio_venta - costo_unitario) * cantidad, fallback to total if product missing
  const productsById = new Map<number, ServerProduct>();
  productsList.forEach((p) => productsById.set(p.id, p));

  const gananciasHoy = salesList
    .filter((s) => {
      try {
        return new Date(s.hora) >= todayStart;
      } catch {
        return false;
      }
    })
    .reduce((acc, s) => {
      const prod = productsById.get(s.producto_id);
      if (prod) return acc + (prod.precio_venta - prod.costo_unitario) * s.cantidad;
      return acc + Number(s.total); // fallback
    }, 0);

  // Producto más vendido (cantidad total)
  const soldQtyMap = new Map<number, number>();
  for (const s of salesList) {
    soldQtyMap.set(s.producto_id, (soldQtyMap.get(s.producto_id) || 0) + s.cantidad);
  }
  const topEntry = Array.from(soldQtyMap.entries()).sort((a, b) => b[1] - a[1])[0];
  const productoMasVendido = topEntry
    ? { id: topEntry[0], cantidad: topEntry[1], nombre: productsById.get(topEntry[0])?.nombre ?? "Desconocido" }
    : { id: 0, cantidad: 0, nombre: "—" };

  // Stock bajo
  const stockBajo = productsList.filter((p) => p.stock <= STOCK_ALERT_THRESHOLD);

  // Last 7 days stats
  const ventas7dias: { dia: string; ventas: number }[] = [];
  const ganancias7dias: { dia: string; ganancia: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = daysAgo(i);
    const dayStart = day.getTime();
    const dayEnd = startOfDay(new Date(day.getTime() + 24 * 60 * 60 * 1000)).getTime();
    const ventas = salesList
      .filter((s) => {
        try {
          const t = new Date(s.hora).getTime();
          return t >= dayStart && t < dayEnd;
        } catch {
          return false;
        }
      })
      .reduce((acc, s) => acc + Number(s.total), 0);
    const ganancia = salesList
      .filter((s) => {
        try {
          const t = new Date(s.hora).getTime();
          return t >= dayStart && t < dayEnd;
        } catch {
          return false;
        }
      })
      .reduce((acc, s) => {
        const prod = productsById.get(s.producto_id);
        if (prod) return acc + (prod.precio_venta - prod.costo_unitario) * s.cantidad;
        return acc + Number(s.total);
      }, 0);

    const label = formatDate(day, { month: "short", day: "numeric" });
    ventas7dias.push({ dia: label, ventas: Number(ventas.toFixed(2)) });
    ganancias7dias.push({ dia: label, ganancia: Number(ganancia.toFixed(2)) });
  }

  return (
    <div className="w-full max-w-screen-2xl bg-white rounded-2xl shadow-2xl p-10 mx-auto my-8">
      <h2 className="text-3xl font-bold mb-6 text-center text-yellow-600 flex items-center gap-2">
        <span>📊</span> Panel de control
      </h2>

      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-blue-50 rounded-xl p-6 shadow-sm flex flex-col w-full">
            <span className="text-gray-500">Ventas del día</span>
            <span className="text-2xl font-bold text-yellow-600">{formatCurrency(ventasHoy)}</span>
          </div>

          {/* Mostrar Ganancias netas solo para admin */}
          {role === "admin" && (
            <div className="bg-green-50 rounded-xl p-6 shadow-sm flex flex-col w-full">
              <span className="text-gray-500">Ganancias netas</span>
              <span className="text-2xl font-bold text-green-600">{formatCurrency(gananciasHoy)}</span>
            </div>
          )}

          <div className="bg-yellow-50 rounded-xl p-6 shadow-sm flex flex-col w-full">
            <span className="text-gray-500">Producto más vendido</span>
            <span className="text-lg font-semibold">{productoMasVendido.nombre}</span>
            <span className="text-sm text-gray-400">({productoMasVendido.cantidad} uds.)</span>
          </div>

          <div className="bg-red-50 rounded-xl p-6 shadow-sm flex flex-col w-full">
            <span className="text-gray-500">Stock bajo</span>
            <ul className="mt-1 text-sm text-red-600">
              {stockBajo.length === 0 ? <li>Sin alertas</li> : stockBajo.map((prod) => <li key={prod.id}>{prod.nombre} ({prod.stock} uds.)</li>)}
            </ul>
          </div>

          {/* Mostrar estado de carga / error para usar las variables y evitar TS6133 */}
          {loading && (
            <div className="mb-4 text-center text-gray-600">Cargando datos...</div>
          )}
          {error && (
            <div className="mb-4 text-center text-red-600">Error: {String(error)}</div>
          )}

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm w-full">
            <h3 className="font-semibold mb-2 text-gray-700">Ventas últimos 7 días</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={ventas7dias}>
                <XAxis dataKey="dia" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="ventas" stroke="#2563eb" strokeWidth={2} />
                <CartesianGrid stroke="#eee" strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Mostrar Ganancias últimos 7 días solo para admin */}
          {role === "admin" && (
            <div className="bg-white rounded-xl p-6 shadow-sm w-full">
              <h3 className="font-semibold mb-2 text-gray-700">Ganancias últimos 7 días</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={ganancias7dias}>
                  <XAxis dataKey="dia" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="ganancia" fill="#22c55e" />
                  <CartesianGrid stroke="#eee" strokeDasharray="4 4" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}