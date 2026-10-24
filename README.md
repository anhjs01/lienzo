# Lienzo

Editor gráfico web profesional, construido desde cero con TypeScript y Vite.

## Estado
**Fase 4 — Persistencia local y gestión de documentos (en desarrollo).**

La aplicación se desarrolla por fases verificables. La base actual permite dibujar con trazos suavizados, añadir formas, texto e imágenes, seleccionar y mover objetos, redimensionarlos desde sus tiradores, administrar capas, ajustar opacidad, rellenar rectángulos y elipses con su color actual, aplicar filtros visuales a imágenes importadas, guardar el proyecto editable en el almacenamiento local del navegador, recuperar el último guardado y crear un documento nuevo conservando la última copia guardada, además de exportar PNG. La validación automática de compilación está configurada; cada fase debe probarse en el navegador antes de considerarse terminada.

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
3. Pinceles avanzados, edición de formas e imágenes y filtros.
4. Persistencia local de capas e imágenes, gestión de documentos e importación/exportación.
5. Pruebas, accesibilidad, rendimiento y pulido final.
