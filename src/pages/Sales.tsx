import { useEffect, useState } from "react";
import { products, sales } from "../lib/api";
import { formatCurrency, formatDate } from "../lib/format";

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
  transaction_id?: string | number | null;
};

type CartItem = {
  producto_id: number;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  total: number;
};

export default function Sales() {
  const [productsList, setProductsList] = useState<ServerProduct[]>([]);
  const [salesList, setSalesList] = useState<ServerSale[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | "">("");
  const [qty, setQty] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = async () => {
    try {
      const p = await products.list();
      const prodArr: ServerProduct[] = Array.isArray(p) ? p : [];
      setProductsList(prodArr);
      if (prodArr.length && selectedProductId === "") setSelectedProductId(prodArr[0].id);
    } catch (err: any) {
      console.error("Failed loading products", err);
      setProductsList([]);
    }
  };

  // use API wrapper so Authorization header is applied
  const loadSales = async () => {
    try {
      const data = await sales.list();
      const arr: ServerSale[] = Array.isArray(data) ? data : [];
      arr.sort((a, b) => new Date(b.hora).getTime() - new Date(a.hora).getTime());
      setSalesList(arr);
    } catch (err: any) {
      console.error("Failed loading sales", err);
      setSalesList([]);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    await Promise.all([loadProducts(), loadSales()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const computeProductTotal = (prodId: number | "", quantity: number) => {
    const prod = productsList.find((x) => x.id === prodId);
    if (!prod || isNaN(quantity) || quantity <= 0) return 0;
    return Number((prod.precio_venta * quantity).toFixed(2));
  };

  const computeCartTotal = () => cart.reduce((s, it) => s + Number(it.total || 0), 0);

  const handleAddToCart = () => {
    const qtyNum = parseInt(qty || "0", 10);
    if (selectedProductId === "" || isNaN(qtyNum) || qtyNum < 1) {
      setError("Selecciona producto y cantidad válida (>= 1)");
      return;
    }
    const prod = productsList.find((p) => p.id === selectedProductId);
    if (!prod) {
      setError("Producto inválido");
      return;
    }
    if (prod.stock != null && qtyNum > prod.stock) {
      if (!confirm("La cantidad excede el stock disponible. Deseas agregarla igual?")) return;
    }

    const existingIndex = cart.findIndex((c) => c.producto_id === prod.id);
    if (existingIndex >= 0) {
      const copy = [...cart];
      const existing = copy[existingIndex];
      const newQty = existing.cantidad + qtyNum;
      existing.cantidad = newQty;
      existing.total = Number((existing.precio_unitario * newQty).toFixed(2));
      setCart(copy);
    } else {
      const item: CartItem = {
        producto_id: prod.id,
        nombre: prod.nombre,
        cantidad: qtyNum,
        precio_unitario: prod.precio_venta,
        total: computeProductTotal(prod.id, qtyNum),
      };
      setCart((c) => [...c, item]);
    }
    setQty("");
    setError(null);
  };

  const handleRemoveFromCart = (producto_id: number) => {
    setCart((c) => c.filter((it) => it.producto_id !== producto_id));
  };

  const handleRegister = async () => {
    if (cart.length === 0) {
      setError("El carrito está vacío");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const transactionPayload = { items: cart.map((it) => ({ producto_id: it.producto_id, cantidad: it.cantidad })) };

      // try server-side transaction if available; otherwise fallback to per-item creates
      try {
        if ((sales as any).transaction) {
          await (sales as any).transaction(transactionPayload);
        } else {
          const promises = cart.map((it) => sales.create({ producto_id: it.producto_id, cantidad: it.cantidad }));
          await Promise.all(promises);
        }
      } catch (txErr) {
        console.warn("Transaction failed, falling back to per-item create", txErr);
        const promises = cart.map((it) => sales.create({ producto_id: it.producto_id, cantidad: it.cantidad }));
        await Promise.all(promises);
      }

      await loadAll();
      setCart([]);
    } catch (err: any) {
      console.error("Register sale(s) failed", err);
      setError(err?.message ?? "Error al registrar venta(s)");
    } finally {
      setLoading(false);
    }
  };

  const groupedSales = (() => {
    const map = new Map<string, { key: string; hora: string; items: { nombre: string; cantidad: number; total: number }[]; total: number; qty: number }>();
    for (const s of salesList) {
      const groupKey = s.transaction_id != null ? String(s.transaction_id) : (() => {
        try {
          return new Date(s.hora).toISOString().slice(0, 19);
        } catch {
          return String(s.id);
        }
      })();

      const entry = map.get(groupKey) ?? { key: groupKey, hora: s.hora, items: [], total: 0, qty: 0 };
      entry.items.push({ nombre: s.nombre, cantidad: s.cantidad || 0, total: Number(s.total || 0) });
      entry.total += Number(s.total || 0);
      entry.qty += Number(s.cantidad || 0);
      map.set(groupKey, entry);
    }
    return Array.from(map.values()).sort((a, b) => new Date(b.hora).getTime() - new Date(a.hora).getTime());
  })();

  return (
    <div className="min-h-screen bg-yellow-400 flex justify-center items-start py-12 px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6">
        <h2 className="text-2xl font-bold text-yellow-600 mb-4">Registrar venta</h2>

        {error && <div className="text-red-600 mb-3">{String(error)}</div>}

        <div className="mb-3">
          <label className="block mb-1">Producto</label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(Number(e.target.value))}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            <option value="" disabled>
              {loading ? "Cargando..." : "Selecciona producto"}
            </option>
            {productsList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} (Stock: {p.stock})
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="block mb-1">Cantidad</label>
          <input
            type="number"
            min={1}
            step={1}
            value={qty}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "") {
                setQty("");
                return;
              }
              const cleaned = v.replace(/[^0-9]/g, "");
              setQty(cleaned);
            }}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            placeholder=""
            aria-label="Cantidad"
          />
        </div>

        <div className="mb-3">
          <div>
            Total producto: <strong>{formatCurrency(computeProductTotal(selectedProductId as number, parseInt(qty || "0", 10)))}</strong>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={handleAddToCart}
            disabled={loading || selectedProductId === ""}
            className="px-3 py-2 border border-gray-300 rounded-md text-gray-800 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Agregar
          </button>

          <button
            onClick={handleRegister}
            disabled={loading || cart.length === 0}
            className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:opacity-50"
          >
            Registrar venta(s)
          </button>

          <button
            onClick={loadAll}
            disabled={loading}
            className="px-3 py-2 border border-gray-300 rounded-md text-gray-800 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Refrescar
          </button>
        </div>

        <div className="mb-4">
          <h3 className="font-semibold mb-2">Carrito</h3>
          {cart.length === 0 ? (
            <div className="text-gray-500">Carrito vacío</div>
          ) : (
            <div className="mb-2">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-600">
                    <th>Producto</th>
                    <th>Cant</th>
                    <th>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((c) => (
                    <tr key={c.producto_id} className="border-t">
                      <td className="py-2 px-2">{c.nombre}</td>
                      <td className="py-2 px-2">{c.cantidad}</td>
                      <td className="py-2 px-2">{formatCurrency(c.total)}</td>
                      <td className="py-2 px-2">
                        <button className="text-sm text-red-600" onClick={() => handleRemoveFromCart(c.producto_id)}>
                          Quitar
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={2} className="py-2 px-2 font-semibold">Total</td>
                    <td className="py-2 px-2 font-semibold">{formatCurrency(computeCartTotal())}</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        <h3 className="font-semibold mb-2">Ventas recientes</h3>
        <div className="overflow-auto max-h-48">
          {loading ? (
            <div>Cargando...</div>
          ) : groupedSales.length === 0 ? (
            <div className="text-gray-500">Sin ventas</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-600">
                  <th>Productos</th>
                  <th>Cantidad</th>
                  <th>Total</th>
                  <th>Hora</th>
                </tr>
              </thead>
              <tbody>
                {groupedSales.map((g, idx) => (
                  <tr key={g.key + "_" + idx} className="border-t align-top">
                    <td className="py-2 px-2">
                      {g.items.map((it, i) => (
                        <div key={i} className="text-sm">
                          {it.nombre} <span className="text-gray-500">({it.cantidad})</span>
                        </div>
                      ))}
                    </td>
                    <td className="py-2 px-2">{g.qty}</td>
                    <td className="py-2 px-2">{formatCurrency(g.total)}</td>
                    <td className="py-2 px-2">{formatDate(g.hora)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}