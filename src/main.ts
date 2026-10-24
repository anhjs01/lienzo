import './style.css';

type Tool = 'select' | 'pen' | 'eraser' | 'line' | 'rect' | 'ellipse' | 'text';
type Point = { x: number; y: number };
type LayerMeta = { id: string; opacity: number; visible: boolean; name?: string };
type Stroke = LayerMeta & { kind: 'stroke'; points: Point[]; color: string; width: number; erase: boolean };
type Shape = LayerMeta & { kind: 'shape'; shape: 'line' | 'rect' | 'ellipse'; from: Point; to: Point; color: string; width: number; fill: boolean };
type TextItem = LayerMeta & { kind: 'text'; at: Point; text: string; color: string; size: number };
type ImageFilter = 'none' | 'grayscale' | 'sepia' | 'contrast' | 'saturate' | 'blur';
type ImageItem = LayerMeta & { kind: 'image'; image: HTMLImageElement; x: number; y: number; width: number; height: number; filter: ImageFilter };
type Item = Stroke | Shape | TextItem | ImageItem;

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('No se encontró el contenedor de Lienzo.');

app.innerHTML = `
  <div class="app-shell">
    <header class="topbar">
      <a class="brand" href="#" aria-label="Lienzo, inicio"><span class="brand-mark">L</span><span>Lienzo</span><span class="brand-tag">STUDIO</span></a>
      <div class="document-title"><span class="status-dot"></span><span id="doc-title">Proyecto sin título</span><span class="saved-label" id="save-status">Listo para crear</span></div>
      <div class="top-actions">
        <button class="icon-button subtle" id="undo" title="Deshacer (Ctrl+Z)" aria-label="Deshacer">↶</button>
        <button class="icon-button subtle" id="redo" title="Rehacer (Ctrl+Shift+Z)" aria-label="Rehacer">↷</button>
        <span class="top-divider"></span>
        <button class="button button-quiet" id="import-btn"><span>＋</span> Importar</button>
        <button class="button button-primary" id="export-btn"><span>↗</span> Exportar</button>
      </div>
    </header>
    <main class="workspace">
      <aside class="tool-rail" aria-label="Herramientas">
        <div class="rail-group">
          <button class="tool-button active" data-tool="select" title="Seleccionar (V)" aria-label="Seleccionar"><span class="tool-glyph">↖</span><small>Elegir</small></button>
          <button class="tool-button" data-tool="pen" title="Pincel (B)" aria-label="Pincel"><span class="tool-glyph">✎</span><small>Pincel</small></button>
          <button class="tool-button" data-tool="eraser" title="Borrador (E)" aria-label="Borrador"><span class="tool-glyph">⌫</span><small>Borrar</small></button>
          <span class="rail-rule"></span>
          <button class="tool-button" data-tool="line" title="Línea (L)" aria-label="Línea"><span class="tool-glyph">／</span><small>Línea</small></button>
          <button class="tool-button" data-tool="rect" title="Rectángulo (R)" aria-label="Rectángulo"><span class="tool-glyph">▱</span><small>Forma</small></button>
          <button class="tool-button" data-tool="ellipse" title="Elipse (O)" aria-label="Elipse"><span class="tool-glyph">◯</span><small>Elipse</small></button>
          <button class="tool-button" data-tool="text" title="Texto (T)" aria-label="Texto"><span class="tool-glyph">T</span><small>Texto</small></button>
        </div>
        <div class="rail-bottom"><span class="avatar">✦</span><small>CREA</small></div>
      </aside>
      <section class="editor-area">
        <div class="editor-toolbar">
          <div class="toolbar-context"><span class="context-kicker">TU ESPACIO CREATIVO</span><strong id="tool-label">Seleccionar</strong></div>
          <div class="toolbar-options">
            <label class="color-control" title="Color"><input id="color" type="color" value="#8067f2" aria-label="Color de herramienta" /><span id="color-value">#8067F2</span></label>
            <span class="option-divider"></span>
            <label class="size-control" for="brush-size"><span>Grosor</span><input id="brush-size" type="range" min="1" max="40" value="5" /><output id="size-value">5 px</output></label>
            <span class="option-divider"></span>
            <button class="icon-button" id="clear" title="Limpiar lienzo" aria-label="Limpiar lienzo">⌫</button>
          </div>
        </div>
        <div class="canvas-stage" id="canvas-stage">
          <div class="stage-label"><span class="stage-label-dot"></span> LIENZO PRINCIPAL <span class="stage-separator">/</span> 01</div>
          <div class="paper-wrap" id="paper-wrap">
            <canvas id="canvas" width="1200" height="800" aria-label="Lienzo de dibujo. Usa las herramientas de la izquierda para crear." tabindex="0"></canvas>
            <div class="paper-hint" id="paper-hint"><span class="hint-icon">✳</span><strong>Todo empieza con una idea.</strong><span>Elige una herramienta y hazla realidad.</span></div>
          </div>
          <div class="stage-footer"><span id="canvas-dimensions">1200 × 800 px</span><span class="stage-footer-center"><span class="live-dot"></span> ESPACIO DE TRABAJO ACTIVO</span><span id="zoom-label">100%</span></div>
        </div>
        <div class="bottom-bar"><span><kbd>V</kbd> Selección <span class="bottom-sep">·</span> <kbd>B</kbd> Pincel <span class="bottom-sep">·</span> <kbd>T</kbd> Texto</span><span class="bottom-tip">Hecho para tus ideas <span>✦</span></span></div>
      </section>
      <aside class="inspector" id="inspector">
        <div class="inspector-heading"><div><span class="context-kicker">DETALLES</span><h2>Tu proyecto</h2></div><button class="icon-button inspector-close" id="close-inspector" aria-label="Ocultar panel">×</button></div>
        <section class="inspector-section">
          <div class="section-heading"><span>Documento</span><span class="section-index">01</span></div>
          <div class="document-preview"><div class="preview-grid"><span></span><span></span><span></span><span></span></div><div class="preview-badge">✦</div></div>
          <label class="field-label" for="project-name">Nombre del proyecto</label><input class="text-field" id="project-name" value="Proyecto sin título" maxlength="80" />
          <div class="dimension-row"><div><span class="field-label">Ancho</span><strong>1200 <small>px</small></strong></div><div><span class="field-label">Alto</span><strong>800 <small>px</small></strong></div></div>
        </section>
        <section class="inspector-section layers-section">
          <div class="section-heading"><span>Capas</span><span class="layer-count" id="layer-count">01</span></div>
          <div class="layer-row selected"><span class="layer-thumb">▧</span><span class="layer-name">Fondo del lienzo</span><span class="layer-eye">◉</span></div>
          <div id="layers-list"></div>
          <div id="layer-properties" class="layer-properties" hidden>
            <label class="field-label" for="layer-name-input">Nombre de capa</label>
            <input class="text-field" id="layer-name-input" maxlength="60" value="" />
            <label class="opacity-label" for="layer-opacity"><span>Opacidad</span><output id="opacity-value">100%</output></label>
            <input id="layer-opacity" class="opacity-slider" type="range" min="0" max="100" value="100" />
            <div class="layer-actions">
              <button type="button" id="layer-up" title="Subir capa">↑ Orden</button>
              <button type="button" id="layer-down" title="Bajar capa">↓ Orden</button>
              <button type="button" id="layer-delete" title="Eliminar capa">Eliminar</button>
            </div>
            <label id="shape-fill-control" class="shape-fill-control" hidden><input id="shape-fill" type="checkbox" /> Rellenar forma con el color actual</label>
            <div id="image-filter-control" class="image-filter-control" hidden><label class="field-label" for="image-filter">Filtro de imagen</label><select id="image-filter" class="text-field"><option value="none">Original</option><option value="grayscale">Blanco y negro</option><option value="sepia">Sepia</option><option value="contrast">Contraste</option><option value="saturate">Color intenso</option><option value="blur">Desenfoque suave</option></select><p class="filter-note">El filtro se conserva al exportar el diseño como PNG.</p></div>
            <button type="button" id="edit-text" class="edit-text-button" hidden>Editar contenido del texto</button>
          </div>
          <p class="layers-note">Selecciona una capa para moverla, renombrarla, ajustar su opacidad o cambiar su orden.</p>
        </section>
        <div class="inspector-bottom"><span class="inspector-star">✳</span><p><strong>Un espacio, infinitas posibilidades.</strong><span>Tu creatividad marca el límite.</span></p></div>
      </aside>
    </main>
    <input type="file" id="file-input" accept="image/*" hidden />
    <div class="toast" id="toast" role="status" aria-live="polite"></div>
    <div class="mobile-bottom"><button data-tool="select" class="mobile-tool active">↖<span>Elegir</span></button><button data-tool="pen" class="mobile-tool">✎<span>Pincel</span></button><button data-tool="eraser" class="mobile-tool">⌫<span>Borrar</span></button><button data-tool="text" class="mobile-tool">T<span>Texto</span></button><button id="mobile-more" class="mobile-tool">•••<span>Más</span></button></div>
  </div>
`;

const canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;
const ctx = canvas.getContext('2d')!;
const hint = document.querySelector<HTMLDivElement>('#paper-hint')!;
const colorInput = document.querySelector<HTMLInputElement>('#color')!;
const sizeInput = document.querySelector<HTMLInputElement>('#brush-size')!;
const sizeValue = document.querySelector<HTMLOutputElement>('#size-value')!;
const colorValue = document.querySelector<HTMLSpanElement>('#color-value')!;
const toast = document.querySelector<HTMLDivElement>('#toast')!;
const fileInput = document.querySelector<HTMLInputElement>('#file-input')!;
let tool: Tool = 'select';
let items: Item[] = [];
let history: Item[][] = [[]];
let historyIndex = 0;
let selectedId: string | null = null;
let dragStart: Point | null = null;
let dragOrigin: Item | null = null;
let hasMoved = false;
let resizing = false;
function makeMeta(): LayerMeta { return { id: crypto.randomUUID(), opacity: 1, visible: true }; }
function cloneItem(item: Item): Item { return { ...item, ...(item.kind === 'stroke' ? { points: item.points.map(p => ({ ...p })) } : {}), ...(item.kind === 'shape' ? { from: { ...item.from }, to: { ...item.to } } : {}), ...(item.kind === 'text' ? { at: { ...item.at } } : {}) }; }
let activeStroke: Stroke | null = null;
let shapeStart: Point | null = null;
let previewShape: Shape | null = null;
let toastTimer = 0;

function pointFromEvent(event: PointerEvent): Point {
  const rect = canvas.getBoundingClientRect();
  return { x: Math.max(0, Math.min(canvas.width, (event.clientX - rect.left) * canvas.width / rect.width)), y: Math.max(0, Math.min(canvas.height, (event.clientY - rect.top) * canvas.height / rect.height)) };
}
function paintItem(item: Item, target: CanvasRenderingContext2D = ctx): void {
  if (!item.visible) return;
  target.save(); target.globalAlpha *= item.opacity;
  if (item.kind === 'stroke') {
    target.globalCompositeOperation = 'source-over';
    target.strokeStyle = item.erase ? '#ffffff' : item.color; target.fillStyle = item.erase ? '#ffffff' : item.color; target.lineWidth = item.width; target.lineCap = 'round'; target.lineJoin = 'round';
    if (item.points.length === 1) { target.beginPath(); target.arc(item.points[0]!.x, item.points[0]!.y, item.width / 2, 0, Math.PI * 2); target.fill(); }
    else { target.beginPath(); target.moveTo(item.points[0]!.x, item.points[0]!.y); if (item.points.length === 2) target.lineTo(item.points[1]!.x, item.points[1]!.y); else { for (let i = 1; i < item.points.length - 1; i++) { const current = item.points[i]!; const following = item.points[i + 1]!; target.quadraticCurveTo(current.x, current.y, (current.x + following.x) / 2, (current.y + following.y) / 2); } const last = item.points[item.points.length - 1]!; target.lineTo(last.x, last.y); } target.stroke(); }
  } else if (item.kind === 'shape') {
    target.strokeStyle = item.color; target.lineWidth = item.width; target.lineCap = 'round';
    const w = item.to.x - item.from.x, h = item.to.y - item.from.y;
    target.beginPath();
    if (item.shape === 'line') { target.moveTo(item.from.x, item.from.y); target.lineTo(item.to.x, item.to.y); }
    else if (item.shape === 'rect') target.rect(item.from.x, item.from.y, w, h);
    else target.ellipse(item.from.x + w / 2, item.from.y + h / 2, Math.abs(w / 2), Math.abs(h / 2), 0, 0, Math.PI * 2);
    if (item.fill && item.shape !== 'line') { target.fillStyle = item.color; target.fill(); }
    target.stroke();
  } else if (item.kind === 'text') {
    target.fillStyle = item.color; target.font = `600 ${item.size}px sans-serif`; target.textBaseline = 'top';
    item.text.split('\n').forEach((line, i) => target.fillText(line, item.at.x, item.at.y + i * item.size * 1.25));
  } else if (item.image.complete) {
    const filters: Record<ImageFilter, string> = { none: 'none', grayscale: 'grayscale(1)', sepia: 'sepia(1)', contrast: 'contrast(1.25)', saturate: 'saturate(1.6)', blur: 'blur(2px)' };
    target.filter = filters[item.filter] ?? 'none';
    target.drawImage(item.image, item.x, item.y, item.width, item.height);
    target.filter = 'none';
  }
  target.restore();
}
function redraw(): void {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  items.forEach(item => paintItem(item));
  if (activeStroke) paintItem(activeStroke);
  if (previewShape) { ctx.save(); ctx.globalAlpha = 0.72; paintItem(previewShape); ctx.restore(); }
  const selected = items.find(item => item.id === selectedId && item.visible);
  if (selected) drawSelection(selected);
  hint.classList.toggle('hidden', items.length > 0 || !!activeStroke);
  renderLayers();
  renderLayerProperties();
}
function snapshot(): void {
  history = history.slice(0, historyIndex + 1);
  history.push(items.map(cloneItem)); historyIndex = history.length - 1;
  if (history.length > 101) { history.shift(); historyIndex--; }
  updateHistoryButtons(); document.querySelector('#save-status')!.textContent = 'Cambios sin guardar';
}
function updateHistoryButtons(): void {
  document.querySelector<HTMLButtonElement>('#undo')!.disabled = historyIndex <= 0;
  document.querySelector<HTMLButtonElement>('#redo')!.disabled = historyIndex >= history.length - 1;
}
function commitItem(item: Item): void { items.push(item); selectedId = item.id; snapshot(); redraw(); }
function undo(): void {
  if (historyIndex <= 0) return;
  historyIndex--; items = history[historyIndex]!.map(cloneItem); selectedId = items.some(item => item.id === selectedId) ? selectedId : null; redraw(); updateHistoryButtons(); showToast('Última acción deshecha');
}
function redo(): void {
  if (historyIndex >= history.length - 1) return;
  historyIndex++; items = history[historyIndex]!.map(cloneItem); selectedId = items.some(item => item.id === selectedId) ? selectedId : null; redraw(); updateHistoryButtons(); showToast('Acción restaurada');
}
function showToast(message: string): void {
  toast.textContent = message; toast.classList.add('visible');
  window.clearTimeout(toastTimer); toastTimer = window.setTimeout(() => toast.classList.remove('visible'), 2400);
}
function setTool(next: Tool): void {
  tool = next;
  document.querySelectorAll<HTMLElement>('[data-tool]').forEach(el => el.classList.toggle('active', el.dataset.tool === next));
  const labels: Record<Tool, string> = { select: 'Seleccionar', pen: 'Pincel', eraser: 'Borrador', line: 'Línea', rect: 'Rectángulo', ellipse: 'Elipse', text: 'Texto' };
  document.querySelector('#tool-label')!.textContent = labels[next];
  canvas.style.cursor = next === 'select' ? 'default' : next === 'text' ? 'text' : 'crosshair';
}
function renderLayers(): void {
  const list = document.querySelector<HTMLDivElement>('#layers-list')!;
  list.innerHTML = '';
  items.map((item, i) => ({ item, i })).reverse().forEach(({ item, i }) => {
    const row = document.createElement('div'); row.className = 'layer-row' + (item.id === selectedId ? ' selected' : '') + (!item.visible ? ' layer-hidden' : '');
    row.tabIndex = 0; row.setAttribute('role', 'button'); row.setAttribute('aria-label', 'Seleccionar capa ' + layerName(item));
    row.addEventListener('click', () => { selectedId = item.id; redraw(); });
    row.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectedId = item.id; redraw(); } });
    const thumb = document.createElement('span'); thumb.className = 'layer-thumb'; thumb.textContent = item.kind === 'text' ? 'T' : item.kind === 'shape' ? '◇' : item.kind === 'image' ? '▧' : '〰';
    if ('color' in item) thumb.style.color = item.color;
    const name = document.createElement('span'); name.className = 'layer-name'; name.textContent = layerName(item);
    const eye = document.createElement('button'); eye.type = 'button'; eye.className = 'layer-visibility'; eye.textContent = item.visible ? '◉' : '○'; eye.title = item.visible ? 'Ocultar capa' : 'Mostrar capa'; eye.setAttribute('aria-label', eye.title);
    eye.addEventListener('click', event => { event.stopPropagation(); item.visible = !item.visible; snapshot(); redraw(); });
    const index = document.createElement('span'); index.className = 'layer-index'; index.textContent = String(i + 1).padStart(2, '0');
    row.append(thumb, name, eye, index); list.append(row);
  });
  document.querySelector('#layer-count')!.textContent = String(items.length + 1).padStart(2, '0');
}
function layerName(item: Item): string {
  if (item.name?.trim()) return item.name.trim();
  return item.kind === 'text' ? item.text.slice(0, 20) || 'Texto' : item.kind === 'shape' ? ({ line: 'Línea', rect: 'Rectángulo', ellipse: 'Elipse' }[item.shape]) : item.kind === 'image' ? 'Imagen importada' : item.erase ? 'Borrado' : 'Trazo';
}
function bounds(item: Item): { x: number; y: number; w: number; h: number } {
  if (item.kind === 'text') { ctx.save(); ctx.font = `600 ${item.size}px sans-serif`; const w = Math.max(30, ...item.text.split('\n').map(line => ctx.measureText(line).width)); ctx.restore(); return { x: item.at.x, y: item.at.y, w, h: item.size * 1.3 * item.text.split('\n').length }; }
  if (item.kind === 'image') return { x: item.x, y: item.y, w: item.width, h: item.height };
  if (item.kind === 'shape') return { x: Math.min(item.from.x, item.to.x), y: Math.min(item.from.y, item.to.y), w: Math.max(1, Math.abs(item.to.x-item.from.x)), h: Math.max(1, Math.abs(item.to.y-item.from.y)) };
  const xs = item.points.map(p => p.x), ys = item.points.map(p => p.y), pad = Math.max(8, item.width);
  return { x: Math.min(...xs)-pad, y: Math.min(...ys)-pad, w: Math.max(1,Math.max(...xs)-Math.min(...xs)+pad*2), h: Math.max(1,Math.max(...ys)-Math.min(...ys)+pad*2) };
}
function drawSelection(item: Item): void {
  const b = bounds(item); ctx.save(); ctx.strokeStyle = '#8065ed'; ctx.lineWidth = 2; ctx.setLineDash([7,4]); ctx.strokeRect(b.x-5,b.y-5,b.w+10,b.h+10); ctx.setLineDash([]); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#8065ed';
  [[b.x-5,b.y-5],[b.x+b.w+5,b.y-5],[b.x-5,b.y+b.h+5],[b.x+b.w+5,b.y+b.h+5]].forEach(([x,y])=>{ctx.beginPath();ctx.rect(x-4,y-4,8,8);ctx.fill();ctx.stroke();}); ctx.restore();
}
function renderLayerProperties(): void {
  const item = items.find(candidate => candidate.id === selectedId);
  const controls = document.querySelector<HTMLDivElement>('#layer-properties'); if (!controls) return;
  controls.hidden = !item;
  if (!item) return;
  const nameInput = controls.querySelector<HTMLInputElement>('#layer-name-input')!;
  const opacityInput = controls.querySelector<HTMLInputElement>('#layer-opacity')!;
  const opacityOutput = controls.querySelector<HTMLOutputElement>('#opacity-value')!;
  if (document.activeElement !== nameInput) nameInput.value = item.name ?? layerName(item);
  opacityInput.value = String(Math.round(item.opacity * 100)); opacityOutput.value = `${opacityInput.value}%`;
  if ('color' in item && document.activeElement !== colorInput) { colorInput.value = item.color; colorValue.textContent = item.color.toUpperCase(); }
  if ((item.kind === 'stroke' || item.kind === 'shape') && document.activeElement !== sizeInput) { sizeInput.value = String(Math.max(1, Math.min(40, item.width))); sizeValue.value = `${sizeInput.value} px`; }
  else if (item.kind === 'text' && document.activeElement !== sizeInput) { sizeInput.value = String(Math.max(1, Math.min(40, Math.round(item.size / 6)))); sizeValue.value = `${sizeInput.value} px`; }
  controls.querySelector<HTMLButtonElement>('#layer-up')!.disabled = items.indexOf(item) >= items.length - 1;
  controls.querySelector<HTMLButtonElement>('#layer-down')!.disabled = items.indexOf(item) <= 0;
  controls.querySelector<HTMLButtonElement>('#edit-text')!.hidden = item.kind !== 'text';
  const fillControl = controls.querySelector<HTMLLabelElement>('#shape-fill-control')!;
  fillControl.hidden = item.kind !== 'shape' || item.shape === 'line';
  if (item.kind === 'shape' && item.shape !== 'line') controls.querySelector<HTMLInputElement>('#shape-fill')!.checked = item.fill;
  const filterControl = controls.querySelector<HTMLDivElement>('#image-filter-control')!;
  filterControl.hidden = item.kind !== 'image';
  if (item.kind === 'image') {
    const filterInput = controls.querySelector<HTMLSelectElement>('#image-filter')!;
    if (document.activeElement !== filterInput) filterInput.value = item.filter;
  }
}
function moveItem(item: Item, dx: number, dy: number): void {
  if (item.kind === 'stroke') item.points = item.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
  else if (item.kind === 'shape') { item.from = { x: item.from.x + dx, y: item.from.y + dy }; item.to = { x: item.to.x + dx, y: item.to.y + dy }; }
  else if (item.kind === 'text') item.at = { x: item.at.x + dx, y: item.at.y + dy };
  else { item.x += dx; item.y += dy; }
}
function resizeItem(item: Item, original: Item, sx: number, sy: number): void {
  const b = bounds(original);
  if (item.kind === 'stroke' && original.kind === 'stroke') {
    item.points = original.points.map(p => ({ x: b.x + (p.x - b.x) * sx, y: b.y + (p.y - b.y) * sy }));
    item.width = Math.max(1, original.width * Math.min(sx, sy));
  } else if (item.kind === 'shape' && original.kind === 'shape') {
    item.from = { x: b.x + (original.from.x - b.x) * sx, y: b.y + (original.from.y - b.y) * sy };
    item.to = { x: b.x + (original.to.x - b.x) * sx, y: b.y + (original.to.y - b.y) * sy };
    item.width = Math.max(1, original.width * Math.min(sx, sy));
  } else if (item.kind === 'text' && original.kind === 'text') {
    item.at = { x: b.x + (original.at.x - b.x) * sx, y: b.y + (original.at.y - b.y) * sy };
    item.size = Math.max(8, original.size * Math.max(0.1, (sx + sy) / 2));
  } else if (item.kind === 'image' && original.kind === 'image') {
    item.x = b.x; item.y = b.y; item.width = Math.max(1, original.width * sx); item.height = Math.max(1, original.height * sy);
  }
}
function hitTest(p: Point): Item | null {
  for (let i = items.length - 1; i >= 0; i--) { const item = items[i]!; if (!item.visible) continue; const b = bounds(item); if (p.x >= b.x-8 && p.x <= b.x+b.w+8 && p.y >= b.y-8 && p.y <= b.y+b.h+8) return item; }
  return null;
}
function reorderSelected(direction: -1 | 1): void {
  const index = items.findIndex(item => item.id === selectedId); const next = index + direction;
  if (index < 0 || next < 0 || next >= items.length) return;
  [items[index], items[next]] = [items[next]!, items[index]!]; snapshot(); redraw();
}
function deleteSelected(): void { const index = items.findIndex(item => item.id === selectedId); if (index < 0) return; items.splice(index,1); selectedId = null; snapshot(); redraw(); showToast('Capa eliminada'); }
canvas.addEventListener('pointerdown', event => {
  canvas.setPointerCapture(event.pointerId);
  const p = pointFromEvent(event);
  if (tool === 'select') {
    const selected = items.find(item => item.id === selectedId && item.visible);
    if (selected) {
      const b = bounds(selected);
      if (Math.abs(p.x - (b.x + b.w)) <= 12 && Math.abs(p.y - (b.y + b.h)) <= 12) {
        dragStart = p; dragOrigin = cloneItem(selected); resizing = true; hasMoved = false; redraw(); return;
      }
    }
    const hit = hitTest(p); selectedId = hit?.id ?? null; dragStart = hit ? p : null; dragOrigin = hit ? cloneItem(hit) : null; resizing = false; hasMoved = false; redraw(); return;
  }
  if (tool === 'text') {
    const text = window.prompt('Escribe tu texto:');
    if (text?.trim()) commitItem({ ...makeMeta(), kind: 'text', at: p, text: text.trim(), color: colorInput.value, size: Math.max(16, Number(sizeInput.value) * 6) });
    return;
  }
  if (tool === 'pen' || tool === 'eraser') activeStroke = { ...makeMeta(), kind: 'stroke', points: [p], color: colorInput.value, width: Number(sizeInput.value), erase: tool === 'eraser' };
  else { shapeStart = p; previewShape = { ...makeMeta(), kind: 'shape', shape: tool, from: p, to: p, color: colorInput.value, width: Number(sizeInput.value), fill: false }; }
});
canvas.addEventListener('pointermove', event => {
  const p = pointFromEvent(event);
  if (tool === 'select' && dragStart && selectedId) {
    const item = items.find(candidate => candidate.id === selectedId); if (!item) return;
    const dx = p.x - dragStart.x, dy = p.y - dragStart.y;
    if (Math.abs(dx) + Math.abs(dy) > 1) hasMoved = true;
    if (dragOrigin) {
      const origin = cloneItem(dragOrigin);
      if (resizing) {
        const b = bounds(dragOrigin);
        resizeItem(origin, dragOrigin, Math.max(0.05, (b.w + dx) / Math.max(1, b.w)), Math.max(0.05, (b.h + dy) / Math.max(1, b.h)));
      } else moveItem(origin, dx, dy);
      Object.assign(item, origin); redraw();
    }
  } else if (tool === 'select') {
    const selected = items.find(item => item.id === selectedId && item.visible);
    if (selected) { const b = bounds(selected); canvas.style.cursor = Math.abs(p.x-(b.x+b.w)) <= 12 && Math.abs(p.y-(b.y+b.h)) <= 12 ? 'nwse-resize' : hitTest(p) ? 'move' : 'default'; }
    else canvas.style.cursor = 'default';
  } else if (activeStroke) { activeStroke.points.push(p); redraw(); }
  else if (shapeStart && previewShape) { previewShape.to = p; redraw(); }
});
function finishPointer(): void {
  if (activeStroke) { const finished = activeStroke; activeStroke = null; commitItem(finished); }
  if (shapeStart && previewShape) { const finished = previewShape; shapeStart = null; previewShape = null; commitItem(finished); }
  if (dragStart && selectedId && hasMoved) { snapshot(); redraw(); }
  dragStart = null; dragOrigin = null; hasMoved = false; resizing = false;
}
canvas.addEventListener('pointerup', finishPointer);
canvas.addEventListener('pointercancel', finishPointer);

document.querySelectorAll<HTMLElement>('[data-tool]').forEach(el => el.addEventListener('click', () => setTool(el.dataset.tool as Tool)));
document.querySelector('#undo')!.addEventListener('click', undo);
document.querySelector<HTMLInputElement>('#layer-name-input')!.addEventListener('change', event => {
  const item = items.find(candidate => candidate.id === selectedId); if (!item) return;
  const value = (event.currentTarget as HTMLInputElement).value.trim();
  item.name = value || undefined; snapshot(); redraw();
});
document.querySelector<HTMLInputElement>('#layer-opacity')!.addEventListener('input', event => {
  const item = items.find(candidate => candidate.id === selectedId); if (!item) return;
  const value = (event.currentTarget as HTMLInputElement).value;
  item.opacity = Number(value) / 100;
  document.querySelector<HTMLOutputElement>('#opacity-value')!.value = value + '%';
  redraw();
});
document.querySelector<HTMLInputElement>('#layer-opacity')!.addEventListener('change', () => { snapshot(); redraw(); });
document.querySelector('#layer-up')!.addEventListener('click', () => reorderSelected(1));
document.querySelector('#layer-down')!.addEventListener('click', () => reorderSelected(-1));
document.querySelector('#layer-delete')!.addEventListener('click', deleteSelected);
function editSelectedText(): void {
  const item = items.find(candidate => candidate.id === selectedId);
  if (!item || item.kind !== 'text') return;
  const next = window.prompt('Edita el texto:', item.text);
  if (next === null || !next.trim()) return;
  item.text = next.trim(); snapshot(); redraw();
}
document.querySelector('#edit-text')!.addEventListener('click', editSelectedText);
document.querySelector<HTMLInputElement>('#shape-fill')!.addEventListener('change', event => {
  const item = items.find(candidate => candidate.id === selectedId);
  if (!item || item.kind !== 'shape' || item.shape === 'line') return;
  item.fill = (event.currentTarget as HTMLInputElement).checked;
  snapshot(); redraw(); showToast(item.fill ? 'Relleno activado' : 'Relleno desactivado');
});
document.querySelector<HTMLSelectElement>('#image-filter')!.addEventListener('change', event => {
  const item = items.find(candidate => candidate.id === selectedId);
  if (!item || item.kind !== 'image') return;
  item.filter = (event.currentTarget as HTMLSelectElement).value as ImageFilter;
  snapshot(); redraw(); showToast('Filtro de imagen aplicado');
});
canvas.addEventListener('dblclick', event => {
  const item = hitTest(pointFromEvent(event));
  if (!item || item.kind !== 'text') return;
  selectedId = item.id; editSelectedText();
});
document.querySelector('#redo')!.addEventListener('click', redo);
document.querySelector('#clear')!.addEventListener('click', () => {
  if (!items.length || window.confirm('¿Quieres limpiar todo el lienzo? Esta acción se puede deshacer.')) {
    if (items.length) { items = []; snapshot(); redraw(); updateHistoryButtons(); showToast('Lienzo limpio'); }
  }
});
colorInput.addEventListener('input', () => {
  colorValue.textContent = colorInput.value.toUpperCase();
  const item = items.find(candidate => candidate.id === selectedId);
  if (tool === 'select' && item && 'color' in item && !(item.kind === 'stroke' && item.erase)) { item.color = colorInput.value; redraw(); }
});
colorInput.addEventListener('change', () => {
  const item = items.find(candidate => candidate.id === selectedId);
  if (tool === 'select' && item && 'color' in item && !(item.kind === 'stroke' && item.erase)) snapshot();
});
sizeInput.addEventListener('input', () => {
  sizeValue.value = `${sizeInput.value} px`;
  const item = items.find(candidate => candidate.id === selectedId);
  if (tool === 'select' && item && (item.kind === 'stroke' || item.kind === 'shape')) { item.width = Number(sizeInput.value); redraw(); }
  else if (tool === 'select' && item?.kind === 'text') { item.size = Math.max(8, Number(sizeInput.value) * 6); redraw(); }
});
sizeInput.addEventListener('change', () => {
  const item = items.find(candidate => candidate.id === selectedId);
  if (tool === 'select' && item && (item.kind === 'stroke' || item.kind === 'shape' || item.kind === 'text')) snapshot();
});
document.querySelector<HTMLInputElement>('#project-name')!.addEventListener('input', event => {
  const value = (event.currentTarget as HTMLInputElement).value.trim() || 'Proyecto sin título';
  document.querySelector('#doc-title')!.textContent = value; document.title = `${value} — Lienzo`;
});
document.querySelector('#import-btn')!.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => {
  const file = fileInput.files?.[0]; if (!file) return;
  if (!file.type.startsWith('image/')) { showToast('Selecciona un archivo de imagen.'); return; }
  const url = URL.createObjectURL(file); const source = new Image();
  source.onload = () => {
    const scale = Math.min(canvas.width / source.width, canvas.height / source.height);
    const width = source.width * scale, height = source.height * scale;
    const fitted = new Image();
    fitted.onload = () => { commitItem({ ...makeMeta(), kind: 'image', image: fitted, x: (canvas.width-width)/2, y: (canvas.height-height)/2, width, height, filter: 'none' }); URL.revokeObjectURL(url); showToast('Imagen importada'); };
    fitted.onerror = () => { URL.revokeObjectURL(url); showToast('No se pudo procesar esa imagen.'); };
    fitted.src = source.src;
  };
  source.onerror = () => { URL.revokeObjectURL(url); showToast('No se pudo abrir esa imagen.'); };
  source.src = url; fileInput.value = '';
});
document.querySelector('#export-btn')!.addEventListener('click', () => {
  const out = document.createElement('canvas'); out.width = canvas.width; out.height = canvas.height;
  const outCtx = out.getContext('2d');
  if (!outCtx) { showToast('No se pudo exportar el lienzo.'); return; }
  outCtx.fillStyle = '#ffffff'; outCtx.fillRect(0, 0, out.width, out.height);
  items.forEach(item => paintItem(item, outCtx));
  out.toBlob(blob => {
    if (!blob) { showToast('No se pudo exportar el lienzo.'); return; }
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = `${(document.querySelector<HTMLInputElement>('#project-name')!.value || 'lienzo').replace(/[^a-z0-9-_]/gi, '-').toLowerCase()}.png`;
    link.click(); URL.revokeObjectURL(url); showToast('Exportación PNG preparada');
  }, 'image/png');
});
document.querySelector('#close-inspector')!.addEventListener('click', () => document.querySelector('#inspector')!.classList.toggle('collapsed'));
document.querySelector('#mobile-more')!.addEventListener('click', () => document.querySelector('#inspector')!.classList.toggle('mobile-open'));
document.addEventListener('keydown', event => {
  const target = event.target as HTMLElement;
  if (target.matches('input, textarea')) return;
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); event.shiftKey ? redo() : undo(); return; }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') { event.preventDefault(); redo(); return; }
  const keys: Record<string, Tool> = { v: 'select', b: 'pen', e: 'eraser', l: 'line', r: 'rect', o: 'ellipse', t: 'text' };
  const next = keys[event.key.toLowerCase()]; if (next) setTool(next);
  if ((event.key === 'Delete' || event.key === 'Backspace') && selectedId) { event.preventDefault(); deleteSelected(); return; }
  if (event.key === 'Escape') { activeStroke = null; shapeStart = null; previewShape = null; selectedId = null; dragStart = null; dragOrigin = null; resizing = false; redraw(); }
});
redraw(); updateHistoryButtons(); setTool('select');
