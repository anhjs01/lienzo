# Lienzo

Editor gráfico web profesional, construido desde cero con TypeScript y Vite.

## Estado
**Fase 2 — Objetos seleccionables y capas editables (en desarrollo).**

La aplicación se desarrolla por fases verificables. La base actual permite dibujar, añadir formas, texto e imágenes, seleccionar y mover objetos, redimensionarlos desde el tirador inferior derecho, administrar capas y exportar PNG. La validación automática de compilación está configurada; cada fase debe probarse en el navegador antes de considerarse terminada.

## Desarrollo
- Node.js 20.19+ o 22.12+
- npm

```bash
npm install
npm run dev
npm run build
```

## Principios
- Interfaz adaptable a escritorio, tablet y móvil.
- Herramientas conectadas a un estado de documento real.
- Historial de acciones y persistencia local progresiva.
- Accesibilidad, rendimiento y pruebas como parte del desarrollo.
- Ninguna herramienta se considera terminada solo por aparecer en pantalla.

## Hoja de ruta
1. Fundación, shell adaptable, documento/canvas, herramientas iniciales e historial.
2. Capas, selección, transformaciones y edición de texto.
3. Pinceles avanzados, formas, imágenes y filtros.
4. Persistencia, importación/exportación y PWA.
5. Pruebas, accesibilidad, rendimiento y pulido final.
