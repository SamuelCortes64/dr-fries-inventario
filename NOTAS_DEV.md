# Notas de desarrollo – Dr Fries Inventario

## Resumen de cambios (navegación y vistas)

### Páginas y rutas

- **Resumen** (`/resumen`): dashboard con KPIs, inventario actual, producción y envíos del mes.
- **Calendario** (`/calendario`): vista mensual con producción y envíos por día (FR/CA).
- **Reportes** (`/reportes`): filtros mes/año, gráficos, exportación CSV.
- **Registrar producción** (`/produccion`): misma ruta; dentro de la página hay **tabs**:
  - **Tab 1 – Registrar producción**: formulario para registrar producción (fecha, producto, paquetes, notas).
  - **Tab 2 – Ver producción**: tabla con todos los registros de producción, filtros (Año, Mes, Tipo de papa) y acciones Editar/Eliminar.
- **Registrar envíos** (`/envios`): misma ruta; dentro de la página hay **tabs**:
  - **Tab 1 – Registrar envíos**: formulario para registrar envíos (fecha, cliente, producto, paquetes, notas).
  - **Tab 2 – Ver envíos**: tabla con todos los registros de envíos, filtros (Año, Mes, Tipo de papa, Cliente) y acciones Editar/Eliminar.

### Menú lateral

En el sidebar se mantienen las entradas:

- Resumen  
- Calendario  
- **Registrar producción** → `/produccion`  
- **Registrar envíos** → `/envios`  
- Reportes  

Dentro de `/produccion` y `/envios` el submenú son **tabs** con los textos exactos:

- "Registrar producción" / "Ver producción"  
- "Registrar envíos" / "Ver envíos"  

---

## Filtros y acciones

### Ver producción

- **Filtros (cliente)**: Año (dropdown), Mes (nombre del mes), Tipo de papa (Todas / Papa a la francesa (2.5 kg) / Papas en cascos (2.5 kg)).
- **Tabla**: Fecha, Producto (texto legible), Paquetes, Peso total (kg), Notas, Acciones (Editar / Eliminar).
- **Editar**: modal con mismo formulario que registrar (fecha, producto, paquetes, notas). Al guardar se hace `update` en Supabase y se llama a `refresh()` del hook.
- **Eliminar**: confirmación; luego `delete` en Supabase y `refresh()`.

### Ver envíos

- **Filtros**: Año, Mes, Tipo de papa (Todas / Papa a la francesa / Papas en cascos), Cliente (Todos + lista de clientes).
- **Tabla**: Fecha, Cliente, Producto, Paquetes, Peso total (kg), Notas, Acciones (Editar / Eliminar).
- **Editar / Eliminar**: mismo patrón que en producción; tras cada cambio se llama a `refresh()`.

---

## Lógica compartida y sincronización

- **Fuente de datos**: todo usa el hook **`useDashboardData`** (`src/hooks/useDashboardData.ts`).
  - Carga: `products`, `clients`, `production`, `shipments`, `inventory_summary`.
  - Producción y envíos se piden con un rango de fechas (últimos 12 meses); el inventario viene de la vista `inventory_summary`.
- **Tras crear/editar/eliminar** producción o envío:
  - Se llama a `refresh()` (o el realtime de Supabase dispara la recarga).
  - Se actualizan: listas en "Ver producción" / "Ver envíos", calendario (totales por día), resumen (totales y KPIs), inventario actual (tarjeta y tabla).
- **Inventario**: se usa la vista **`inventory_summary`** como única fuente para stock (suma de paquetes producidos menos enviados por producto). El Resumen y la tabla de inventario leen de ahí; no se recalculan a mano en el front para evitar duplicados o “paquetes fantasma”.
- **Fechas**: en calendario y filtros se usa **`toDateOnly()`** (`src/lib/dates.ts`) para normalizar fechas (solo día, sin hora) y que Resumen, Calendario y listas coincidan.
- **Etiquetas de producto**: **`getStandardProductLabel("FR")`** y **`getStandardProductLabel("CA")`** en `src/lib/products.ts` devuelven "Papa a la francesa (2.5 kg)" y "Papas en cascos (2.5 kg)" en toda la app (formularios, tablas, filtros, resumen).

---

## Responsive

- **Sidebar**: en pantallas pequeñas se oculta y se abre con botón hamburguesa (drawer).
- **Resumen**: tarjetas en 1–2 columnas en móvil, 2–3 en tablet/desktop (grid con `md:grid-cols-2`, `xl:grid-cols-3`).
- **Tablas (Ver producción / Ver envíos)**: contenedor con `overflow-x-auto` y tabla con `min-w-[640px]` para scroll horizontal en móvil sin romper el layout.
- **Tabs**: botones con `min-h-[44px]` para uso táctil.
- **Formularios**: ancho limitado (`max-w-xl`) en escritorio; en móvil ocupan el ancho disponible.

---

## Build y despliegue

- `npm run dev`: arranque en desarrollo.
- `npm run build`: compilación de producción (Next.js).
- No se han introducido cambios en el esquema de Supabase; solo se reutilizan tablas y vista existentes.
