import { useState, useEffect } from "react";
import { products } from "../lib/api";
import type { Product } from "../types";
import Modal from "../components/Modal";

type FormState = {
  nombre: string;
  precioVenta: string; // string to allow empty input
  costoUnitario: string;
  stock: string;
};

const emptyForm: FormState = {
  nombre: "",
  precioVenta: "",
  costoUnitario: "",
  stock: "",
};

type ServerProduct = {
  id: number;
  nombre: string;
  precio_venta: number;
  costo_unitario: number;
  stock: number;
  created_at?: string;
  updated_at?: string;
};

function mapServerToClient(sp: ServerProduct): Product {
  return {
    id: sp.id,
    nombre: sp.nombre,
    precioVenta: Number(sp.precio_venta),
    costoUnitario: Number(sp.costo_unitario),
    stock: Number(sp.stock),
  };
}

function mapFormToServer(f: FormState) {
  return {
    nombre: f.nombre,
    precio_venta: Number(f.precioVenta || 0),
    costo_unitario: Number(f.costoUnitario || 0),
    stock: parseInt(f.stock || "0", 10),
  };
}

export default function Inventory() {
  const [productos, setProductos] = useState<Product[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadProducts = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await products.list();
      const data: ServerProduct[] = Array.isArray(res) ? res : [];
      setProductos(data.map(mapServerToClient));
    } catch (err: any) {
      console.error("Failed to load products", err);
      setErrorMsg(err?.message ?? String(err));
      setProductos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (prod: Product) => {
    setEditId(prod.id);
    setForm({
      nombre: prod.nombre,
      precioVenta: prod.precioVenta === 0 ? "" : String(prod.precioVenta),
      costoUnitario: prod.costoUnitario === 0 ? "" : String(prod.costoUnitario),
      stock: prod.stock === 0 ? "" : String(prod.stock),
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar producto?")) return;
    try {
      await products.remove(id);
      await loadProducts();
    } catch (err) {
      console.error("Delete failed", err);
      alert("No se pudo eliminar el producto.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nombre = form.nombre.trim();
    const precio = parseFloat(form.precioVenta || "0");
    const costo = parseFloat(form.costoUnitario || "0");
    const stockNum = parseInt(form.stock || "0", 10);

    if (!nombre) {
      alert("Nombre requerido");
      return;
    }
    if (isNaN(precio) || precio < 0) {
      alert("Precio inválido");
      return;
    }
    if (isNaN(costo) || costo < 0) {
      alert("Costo inválido");
      return;
    }
    if (isNaN(stockNum) || stockNum < 0) {
      alert("Stock inválido");
      return;
    }

    try {
      const serverBody = mapFormToServer(form);
      if (editId === null) {
        await products.create(serverBody);
      } else {
        await products.update(editId, serverBody);
      }
      setModalOpen(false);
      await loadProducts();
    } catch (err) {
      console.error("Save failed", err);
      alert("Error al guardar el producto.");
    }
  };

  return (
    <div className="min-h-screen bg-yellow-400 flex justify-center items-start py-12 px-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg p-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          <h2 className="text-2xl font-bold text-yellow-600 flex items-center gap-2">
            <span>📦</span> Inventario
          </h2>
          <div className="flex gap-2">
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded"
            >
              Agregar producto
            </button>
            <button
              onClick={loadProducts}
              className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-sm text-gray-800 px-3 py-2 rounded border"
              title="Refrescar"
            >
              Refrescar
            </button>
          </div>
        </div>

        {errorMsg && <div className="mb-4 text-red-600">Error: {String(errorMsg)}</div>}

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded-lg">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-3 px-4 text-left font-semibold text-gray-700">Producto</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-700">Precio Venta</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-700">Costo Unitario</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-700">Stock</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-6">
                    Cargando...
                  </td>
                </tr>
              ) : productos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-gray-400 py-6">
                    Sin productos
                  </td>
                </tr>
              ) : (
                productos.map((prod) => (
                  <tr key={prod.id} className="border-t">
                    <td className="py-3 px-4 align-middle">{prod.nombre}</td>
                    <td className="py-3 px-4 align-middle">S/ {prod.precioVenta.toFixed(2)}</td>
                    <td className="py-3 px-4 align-middle">S/ {prod.costoUnitario.toFixed(2)}</td>
                    <td className="py-3 px-4 align-middle">{prod.stock}</td>
                    <td className="py-3 px-4 align-middle">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(prod)}
                          className="text-sm px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(prod.id)}
                          className="text-sm px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <h3 className="text-lg font-bold mb-2">{editId === null ? "Agregar producto" : "Editar producto"}</h3>

            <label className="flex flex-col gap-2 w-full">
              <span className="text-sm font-medium text-gray-700">Nombre</span>
              <input
                name="nombre"
                type="text"
                className="border rounded px-3 py-2 w-full"
                value={form.nombre}
                onChange={handleChange}
                required
                minLength={2}
              />
            </label>

            <label className="flex flex-col gap-2 w-full">
              <span className="text-sm font-medium text-gray-700">Precio Venta (S/)</span>
              <input
                name="precioVenta"
                type="number"
                className="border rounded px-3 py-2 w-full"
                value={form.precioVenta}
                onChange={handleChange}
                placeholder="0.00"
                min={0}
                step="0.01"
              />
            </label>

            <label className="flex flex-col gap-2 w-full">
              <span className="text-sm font-medium text-gray-700">Costo Unitario (S/)</span>
              <input
                name="costoUnitario"
                type="number"
                className="border rounded px-3 py-2 w-full"
                value={form.costoUnitario}
                onChange={handleChange}
                placeholder="0.00"
                min={0}
                step="0.01"
              />
            </label>

            <label className="flex flex-col gap-2 w-full">
              <span className="text-sm font-medium text-gray-700">Stock</span>
              <input
                name="stock"
                type="number"
                className="border rounded px-3 py-2 w-full"
                value={form.stock}
                onChange={handleChange}
                placeholder="0"
                min={0}
                step="1"
              />
            </label>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                className="px-4 py-2 border rounded text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setModalOpen(false)}
              >
                Cancelar
              </button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded text-sm">
                Guardar
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}