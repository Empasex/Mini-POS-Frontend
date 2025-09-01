import type { Product, Metric } from "../types";

export const productosMock: Product[] = [
  { id: 1, nombre: "Gaseosa Cola 500ml", precioVenta: 2.5, costoUnitario: 1.2, stock: 34 },
  { id: 2, nombre: "Arroz 1kg", precioVenta: 4.0, costoUnitario: 2.5, stock: 2 },
  { id: 3, nombre: "Aceite 1L", precioVenta: 7.5, costoUnitario: 5.0, stock: 1 },
];

export const ventasHoy: number = 1200.5;
export const gananciasHoy: number = 350.75;

export const productoMasVendido: { nombre: string; cantidad: number } = {
  nombre: "Gaseosa Cola 500ml",
  cantidad: 34,
};

export const stockBajo: Product[] = [
  { id: 2, nombre: "Arroz 1kg", precioVenta: 4.0, costoUnitario: 2.5, stock: 2 },
  { id: 3, nombre: "Aceite 1L", precioVenta: 7.5, costoUnitario: 5.0, stock: 1 },
];

export const ventas7dias: Metric[] = [
  { dia: "Lun", ventas: 900, ganancia: 250 },
  { dia: "Mar", ventas: 1100, ganancia: 300 },
  { dia: "Mié", ventas: 1200, ganancia: 350 },
  { dia: "Jue", ventas: 950, ganancia: 220 },
  { dia: "Vie", ventas: 1300, ganancia: 400 },
  { dia: "Sáb", ventas: 1250, ganancia: 370 },
  { dia: "Dom", ventas: 1000, ganancia: 280 },
];

// Para gráficas separadas de ganancias
export const ganancias7dias = ventas7dias.map(({ dia, ganancia }) => ({ dia, ganancia }));
