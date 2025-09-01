import { ventas7dias } from "../data/mock";
import type { Metric } from "../types";


export function getStats() {
  // Simulación simple: usa ventas7dias para todos los filtros
  const ingresosCostos = ventas7dias.map((v) => ({
    label: v.dia,
    ingresos: v.ventas,
    costos: v.ventas - v.ganancia,
  }));
  const gananciaNeta = ventas7dias.map((v) => ({
    label: v.dia,
    ganancia: v.ganancia,
  }));
  return { ingresosCostos, gananciaNeta };
}

export function getTableResumen(filtro: "dia" | "semana" | "mes") {
  const ingresos = ventas7dias.reduce((acc, v) => acc + v.ventas, 0);
  const costos = ventas7dias.reduce((acc, v) => acc + (v.ventas - v.ganancia), 0);
  const ganancia = ventas7dias.reduce((acc, v) => acc + v.ganancia, 0);
  return [
    {
      label: filtro.charAt(0).toUpperCase() + filtro.slice(1),
      ingresos,
      costos,
      ganancia,
    },
  ];
}

// Helpers extra
export function calcularIngresos(metrics: Metric[]): number {
  return metrics.reduce((acc, m) => acc + m.ventas, 0);
}

export function calcularCostos(metrics: Metric[]): number {
  return metrics.reduce((acc, m) => acc + (m.ventas - m.ganancia), 0);
}

export function calcularGanancia(metrics: Metric[]): number {
  return metrics.reduce((acc, m) => acc + m.ganancia, 0);
}
