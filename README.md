# WiseBiz Dashboard (Mini POS)

Este proyecto es un **frontend en React + TypeScript + Vite** que simula un sistema de gestión para pequeños negocios (bodegas, minimarkets, ferreterías, etc.).  
La idea es mostrar en un dashboard sencillo **ventas, inventario, reportes e insights**, con datos mockeados por ahora.  
Más adelante se conectará con un backend en **Spring Boot + MySQL**.

---

## 🎯 Objetivos del proyecto
- Crear una app web estilo SaaS minimalista y profesional.
- Proveer a pequeños negocios un dashboard claro y fácil de usar.
- Servir como **proyecto de portafolio** para aprender integración de frontend moderno.

---

## 🚀 Tecnologías principales
- **React 18** con **TypeScript**
- **Vite** (bundler)
- **TailwindCSS** (estilos)
- **react-router-dom** (rutas)
- **Recharts** (gráficas)
- **lucide-react** (íconos)

---

## 📂 Estructura propuesta
src/
components/ -> componentes reutilizables (Card, Navbar, Sidebar, Table, Modal)
layouts/ -> layouts base (AppLayout con Sidebar y Header)
pages/ -> vistas principales
Login.tsx
Dashboard.tsx
Inventory.tsx
Sales.tsx
Reports.tsx
Insights.tsx
data/ -> mock data para pruebas
lib/ -> helpers y utilidades (ej: cálculos de reportes)
types.ts -> tipos TS comunes
App.tsx -> rutas principales
main.tsx -> punto de entrada
index.css -> estilos globales con Tailwind


---

## 🖼️ Pantallas

### 1. Login
- Formulario con email/contraseña y botón **Entrar** (mock).
- Botón **Entrar en modo demo** → salta directo al Dashboard.

### 2. Dashboard
- **4 tarjetas**: Ventas del día, Ganancias, Producto más vendido, Stock bajo.
- **2 gráficas** con Recharts: ventas semanales y ganancias.
- Sidebar para navegar a todas las páginas.

### 3. Inventory
- Tabla con: Producto, Precio de Venta, Costo Unitario, Stock, Acciones.
- Modal para agregar/editar producto.
- CRUD mock en estado local.

### 4. Sales
- Formulario con dropdown de productos + input cantidad.
- Calcula total automático.
- Tabla con ventas del día.
- Stock disminuye al vender.

### 5. Reports
- Filtros Día / Semana / Mes.
- Gráficas: ingresos, costos, ganancias.
- Tabla resumen + botón **Exportar (placeholder)**.

### 6. Insights (IA mock)
- Card con consejos automáticos (texto fijo por ahora).
- Botón **Regenerar** que rota entre 3–4 mensajes mock.

---

## 🎨 Estilo visual
- Minimalista, estilo SaaS.
- Fondo blanco, gris suave, acentos azul/verde.
- Sidebar lateral fijo en desktop, colapsable en móvil.
- Diseño responsivo (desktop y móvil).

---

## 📊 Datos
- Se usan **JSON mock** en `src/data/mock.ts` para pruebas.
- Más adelante se conectará con backend (Spring Boot + MySQL).
- API se manejará vía `src/lib/api.ts` con axios (pendiente).

---

## 🛠️ Scripts básicos
```bash
# Instalar dependencias
npm install

# Correr en modo desarrollo
npm run dev

# Compilar para producción
npm run build

# Vista previa de producción
npm run preview



---

📌 Recomendación:  
- Pon este archivo como `README.md` en la raíz.  
- Cuando trabajes con Copilot, **ábrelo en VS Code** y Copilot lo usará como referencia.  

---

👉 ¿Quieres que además te dé un **ROADMAP.md** con la lista de prompts ordenados paso a paso (Login → Dashboard → Inventory, etc.) para que vayas copiando y pegando en Copilot?
