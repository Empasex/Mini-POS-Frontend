export type Product = {
  id: number;
  nombre: string;
  precioVenta: number;
  costoUnitario: number;
  stock: number;
};

export type Sale = {
  id: number;
  productoId: number;
  nombre: string;
  cantidad: number;
  total: number;
  hora: string;
};

export type Metric = {
  dia: string;
  ventas: number;
  ganancia: number;
};
