import { useEffect, useState } from "react";
import { archiveApi } from "../lib/api";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { formatCurrency, formatDate } from "../lib/format";

type BatchRow = {
  batch_id: string;
  created_at: string | null;
  total_ingresos: number;
  total_ganancia: number;
  total_items: number;
  min_hora?: string | null;
  max_hora?: string | null;
};

type BatchDetail = {
  producto_id: number;
  nombre: string;
  cantidad_total: number;
  ingresos: number;
  costos: number;
  ganancia: number;
  min_hora?: string | null;
  max_hora?: string | null;
};

export default function Archive() {
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [details, setDetails] = useState<Record<string, BatchDetail[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadBatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await archiveApi.listBatches();
      setBatches(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error("loadBatches error", e);
      setError(e?.message ?? "Error al cargar batches");
      setBatches([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDetails = async (batchId: string) => {
    if (details[batchId]) return;
    try {
      const data = await archiveApi.batchDetail(batchId);
      setDetails((d) => ({ ...d, [batchId]: Array.isArray(data) ? data : [] }));
    } catch (e) {
      console.error("loadDetails error", e);
      setDetails((d) => ({ ...d, [batchId]: [] }));
    }
  };

  useEffect(() => {
    loadBatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (id: string) => {
    setExpanded((e) => (e === id ? null : id));
    if (expanded !== id) loadDetails(id);
  };

  const runArchive = async () => {
    if (!confirm("¿Deseas ejecutar el archivado ahora?")) return;
    setRunning(true);
    setError(null);
    try {
      await archiveApi.runArchive();
      // give backend a moment then refresh
      setTimeout(loadBatches, 1000);
    } catch (e: any) {
      console.error("runArchive error", e);
      setError(e?.message ?? "Error al ejecutar archivado");
    } finally {
      setRunning(false);
    }
  };

  // Export a Excel (.xlsx) for a batch
  const exportBatchExcel = async (batchId: string) => {
    try {
      // ensure details are loaded
      if (!details[batchId]) await loadDetails(batchId);
      const rows = details[batchId] || [];

      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet(`Batch ${batchId}`);

      // Header
      ws.addRow(["producto_id", "nombre", "cantidad_total", "ingresos", "costos", "ganancia"]);

      // Data rows
      rows.forEach((r) => {
        ws.addRow([
          r.producto_id,
          r.nombre ?? "",
          r.cantidad_total,
          Number(r.ingresos).toFixed(2),
          Number(r.costos).toFixed(2),
          Number(r.ganancia).toFixed(2),
        ]);
      });

      // Column widths
      ws.columns = [
        { width: 14 },
        { width: 40 },
        { width: 12 },
        { width: 15 },
        { width: 15 },
        { width: 15 },
      ];

      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, `archive_${batchId}.xlsx`);
    } catch (err) {
      console.error("exportBatchExcel failed", err);
      alert("Error al exportar Excel. Revisa la consola.");
    }
  };

  const handleDeleteBatch = async (batchId: string) => {
    if (!confirm(`Eliminar resumen batch ${batchId}?`)) return;
    try {
      setDeleting(batchId);
      setError(null);
      await archiveApi.deleteBatch(batchId);
      // update UI
      setBatches((b) => b.filter((x) => x.batch_id !== batchId));
      setDetails((d) => {
        const copy = { ...d };
        delete copy[batchId];
        return copy;
      });
      if (expanded === batchId) setExpanded(null);
    } catch (e: any) {
      console.error("deleteBatch error", e);
      setError(e?.message ?? "Error al eliminar batch");
      alert("Error al eliminar batch. Revisa la consola.");
    } finally {
      setDeleting(null);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Eliminar TODOS los resúmenes? Esta acción es irreversible.")) return;
    try {
      setError(null);
      await archiveApi.clearAll(true);
      setBatches([]);
      setDetails({});
      setExpanded(null);
    } catch (e: any) {
      console.error("clearAll error", e);
      setError(e?.message ?? "Error al eliminar todos los resúmenes");
      alert("Error al eliminar todos los resúmenes. Revisa la consola.");
    }
  };

  return (
    <div className="min-h-screen bg-yellow-400 flex justify-center items-start py-12 px-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Archivos / Resúmenes de ventas</h1>
          <p className="text-sm text-gray-600 mt-1">Listado de batches exportados y resúmenes por producto.</p>
        </div>

        <div className="mb-4 flex gap-2">
          <button
            onClick={loadBatches}
            disabled={loading}
            className="px-3 py-1 border rounded-md bg-white text-gray-800 hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? "Cargando..." : "Refrescar"}
          </button>

          <button
            onClick={runArchive}
            disabled={running}
            className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:opacity-50"
          >
            {running ? "Ejecutando..." : "Ejecutar archivado"}
          </button>

          <button
            onClick={handleClearAll}
            disabled={loading}
            className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
          >
            Eliminar todos los resúmenes
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
            {error}. Comprueba que el backend está corriendo en el puerto correcto.
          </div>
        )}

        {loading ? (
          <div>Cargando batches...</div>
        ) : batches.length === 0 ? (
          <div className="p-4 bg-yellow-50 border rounded text-gray-700">No hay batches archivados</div>
        ) : (
          <div className="space-y-3">
            {batches.map((b) => (
              <div key={b.batch_id} className="border rounded-lg p-4 bg-white shadow-sm">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <div className="font-medium text-sm">
                      Batch {b.batch_id} —{" "}
                      {b.created_at ? formatDate(b.created_at) : "fecha desconocida"}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Ingresos: {formatCurrency(Number(b.total_ingresos || 0))} • Ganancia:{" "}
                      {formatCurrency(Number(b.total_ganancia || 0))} • Items: {b.total_items}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {b.min_hora ? `desde ${formatDate(b.min_hora)}` : ""}{" "}
                      {b.max_hora ? `hasta ${formatDate(b.max_hora)}` : ""}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggle(b.batch_id)}
                      className="px-2 py-1 border rounded text-sm bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      {expanded === b.batch_id ? "Cerrar" : "Ver detalle"}
                    </button>

                    <button
                      onClick={async () => {
                        if (!details[b.batch_id]) await loadDetails(b.batch_id);
                        await exportBatchExcel(b.batch_id);
                      }}
                      className="px-2 py-1 text-sm text-gray-700 hover:bg-gray-50 rounded"
                    >
                      Excel
                    </button>

                    <button
                      onClick={() => handleDeleteBatch(b.batch_id)}
                      disabled={deleting !== null}
                      className="px-2 py-1 border rounded text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {deleting === b.batch_id ? "Eliminando..." : "Eliminar batch"}
                    </button>
                  </div>
                </div>

                {expanded === b.batch_id && (
                  <div className="mt-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs text-gray-600">
                            <th className="py-1">Producto</th>
                            <th className="py-1">Cantidad</th>
                            <th className="py-1">Ingresos</th>
                            <th className="py-1">Costos</th>
                            <th className="py-1">Ganancia</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(details[b.batch_id] || []).map((d) => (
                            <tr key={d.producto_id} className="border-t">
                              <td className="py-2">{d.nombre}</td>
                              <td className="py-2">{d.cantidad_total}</td>
                              <td className="py-2">{formatCurrency(Number(d.ingresos || 0))}</td>
                              <td className="py-2">{formatCurrency(Number(d.costos || 0))}</td>
                              <td className="py-2">{formatCurrency(Number(d.ganancia || 0))}</td>
                            </tr>
                          ))}
                          {(details[b.batch_id] || []).length === 0 && (
                            <tr>
                              <td colSpan={5} className="py-3 text-center text-gray-500">
                                Sin detalles
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}