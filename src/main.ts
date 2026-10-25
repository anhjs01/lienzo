import './style.css';

type Tool = 'select' | 'lasso' | 'pen' | 'eraser' | 'line' | 'rect' | 'ellipse' | 'text';
type Point = { x: number; y: number };
type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se';
type LayerMeta = { id: string; opacity: number; visible: boolean; name?: string };
type Stroke = LayerMeta & { kind: 'stroke'; points: Point[]; color: string; width: number; erase: boolean };
type Shape = LayerMeta & { kind: 'shape'; shape: 'line' | 'rect' | 'ellipse'; from: Point; to: Point; color: string; width: number; fill: boolean };
type TextItem = LayerMeta & { kind: 'text'; at: Point; text: string; color: string; size: number };
type ImageFilter = 'none' | 'grayscale' | 'sepia' | 'contrast' | 'saturate' | 'blur';
type HslMix = { h: number; s: number; l: number };
type HslColor = 'red' | 'orange' | 'yellow' | 'green' | 'aqua' | 'blue' | 'purple' | 'magenta';
type ImageItem = LayerMeta & { kind: 'image'; image: HTMLImageElement; x: number; y: number; width: number; height: number; filter: ImageFilter; exposure?: number; contrastAmount?: number; saturationAmount?: number; warmth?: number; highlights?: number; shadows?: number; whites?: number; blacks?: number; vibrance?: number; tint?: number; vignette?: number; grain?: number; maskPoints?: Point[]; hslMix?: Partial<Record<HslColor, HslMix>> };
type Item = Stroke | Shape | TextItem | ImageItem;

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('No se encontró el contenedor de Lienzo.');

const hslColors: { key: HslColor; label: string }[] = [{key:'red',label:'Rojo'},{key:'orange',label:'Naranja'},{key:'yellow',label:'Amarillo'},{key:'green',label:'Verde'},{key:'aqua',label:'Aqua'},{key:'blue',label:'Azul'},{key:'purple',label:'Púrpura'},{key:'magenta',label:'Magenta'}];
const hslBaseHue: Record<HslColor, number> = { red: 0, orange: 30, yellow: 60, green: 120, aqua: 180, blue: 220, purple: 275, magenta: 320 };
const hslHueNeighbors: Record<HslColor, [number, number]> = { red: [30, 320], orange: [0, 60], yellow: [30, 120], green: [60, 180], aqua: [120, 220], blue: [180, 275], purple: [220, 320], magenta: [275, 0] };
function updateHslSliderTrack(input: HTMLInputElement): void {
  const color = input.dataset.hslColor as HslColor | undefined;
  const axis = input.dataset.hslAxis;
  if (!color || !axis) return;
  const hue = hslBaseHue[color];
  if (axis === 'h') {
    const [leftHue, rightHue] = hslHueNeighbors[color];
    input.style.setProperty('--slider-track', `linear-gradient(90deg, hsl(${leftHue} 85% 55%) 0%, hsl(${hue} 85% 55%) 50%, hsl(${rightHue} 85% 55%) 100%)`);
  } else if (axis === 's') {
    input.style.setProperty('--slider-track', `linear-gradient(90deg, hsl(${hue} 0% 52%) 0%, hsl(${hue} 70% 50%) 50%, hsl(${hue} 100% 50%) 100%)`);
  } else {
    input.style.setProperty('--slider-track', `linear-gradient(90deg, hsl(${hue} 100% 0%), hsl(${hue} 85% 50%), hsl(${hue} 100% 100%))`);
  }
}
app.innerHTML = `
  <div class="app-shell">
    <header class="topbar">
      <a class="brand" href="#" aria-label="Lienzo, inicio"><span class="brand-mark">L</span><span>Lienzo</span><span class="brand-tag">STUDIO</span></a>
      <div class="document-title"><span class="status-dot"></span><span id="doc-title">Proyecto sin título</span><span class="saved-label" id="save-status">Listo para crear</span></div>
      <div class="top-actions">
        <button class="icon-button subtle" id="undo" title="Deshacer (Ctrl+Z)" aria-label="Deshacer">↶</button>
        <button class="icon-button subtle" id="redo" title="Rehacer (Ctrl+Shift+Z)" aria-label="Rehacer">↷</button>
        <span class="top-divider"></span>
        <button class="button button-quiet" id="new-project-btn" title="Crear un documento nuevo">Nuevo</button>
        <button class="button button-quiet" id="import-btn"><span>＋</span> Importar</button>
        <button class="button button-quiet" id="save-project-btn" title="Guardar proyecto editable en este navegador"><span>↓</span> Guardar</button>
        <button class="button button-quiet" id="download-project-btn" title="Descargar una copia editable del proyecto">Descargar .lienzo</button>
        <button class="button button-quiet" id="restore-project-btn" title="Recuperar el último proyecto guardado">Abrir guardado</button>
        <button class="button button-quiet" id="open-project-file-btn" title="Abrir un archivo .lienzo">Abrir archivo</button>
        <button class="button button-quiet" id="inspector-toggle" aria-pressed="true" title="Mostrar u ocultar el panel de detalles">Panel</button>
        <button class="button button-primary" id="export-btn"><span>↗</span> Exportar</button>
      </div>
    </header>
    <main class="workspace">
      <aside class="tool-rail" aria-label="Herramientas">
        <div class="rail-group">
          <button class="tool-button active" data-tool="select" title="Seleccionar (V)" aria-label="Seleccionar"><span class="tool-glyph">↖</span><small>Elegir</small></button>
          <button class="tool-button" data-tool="lasso" title="Lazo: dibuja un área de selección" aria-label="Lazo"><span class="tool-glyph">⌁</span><small>Lazo</small></button>
          <button class="tool-button" data-tool="pen" title="Pincel (B)" aria-label="Pincel"><span class="tool-glyph">✎</span><small>Pincel</small></button>
          <button class="tool-button" data-tool="eraser" title="Borrador (E)" aria-label="Borrador"><span class="tool-glyph">⌫</span><small>Borrar</small></button>
          <span class="rail-rule"></span>
          <button class="tool-button" data-tool="line" title="Línea (L)" aria-label="Línea"><span class="tool-glyph">／</span><small>Línea</small></button>
          <button class="tool-button" data-tool="rect" title="Rectángulo (R)" aria-label="Rectángulo"><span class="tool-glyph">▱</span><small>Forma</small></button>
          <button class="tool-button" data-tool="ellipse" title="Elipse (O)" aria-label="Elipse"><span class="tool-glyph">◯</span><small>Elipse</small></button>
          <button class="tool-button" data-tool="text" title="Texto (T)" aria-label="Texto"><span class="tool-glyph">T</span><small>Texto</small></button>
          <span class="rail-rule"></span>
          <button class="photo-tool-button" type="button" data-photo-jump="LUZ" title="Ajustes de luz"><span>☼</span><small>Luz</small></button>
          <button class="photo-tool-button" type="button" data-photo-jump="COLOR" title="Ajustes de color"><span>◉</span><small>Color</small></button>
          <button class="photo-tool-button" type="button" data-photo-jump="MEZCLA DE COLORES" title="Mezcla de colores HSL"><span>◌</span><small>Mezcla</small></button>
          <button class="photo-tool-button" type="button" data-photo-jump="EFECTOS" title="Efectos fotográficos"><span>✧</span><small>Efectos</small></button>
        </div>
        <div class="rail-bottom"><span class="avatar">✦</span><small>CREA</small></div>
      </aside>
      <aside id="photo-panel" class="photo-panel" hidden><div class="photo-panel-heading"><div><span class="context-kicker">AJUSTES FOTOGRÁFICOS</span><h2 id="photo-panel-title">Luz</h2></div><button type="button" id="photo-panel-close" class="icon-button" aria-label="Cerrar ajustes fotográficos">×</button></div><div id="photo-adjustments-panel" class="photo-adjustments" hidden><p class="photo-section-title">LUZ</p><label class="photo-adjustment"><span>Altas luces <output id="photo-highlights-value">0</output></span><input data-photo-adjust="highlights" type="range" min="-100" max="100" value="0" /></label><label class="photo-adjustment"><span>Sombras <output id="photo-shadows-value">0</output></span><input data-photo-adjust="shadows" type="range" min="-100" max="100" value="0" /></label><label class="photo-adjustment"><span>Blancos <output id="photo-whites-value">0</output></span><input data-photo-adjust="whites" type="range" min="-100" max="100" value="0" /></label><label class="photo-adjustment"><span>Negros <output id="photo-blacks-value">0</output></span><input data-photo-adjust="blacks" type="range" min="-100" max="100" value="0" /></label><p class="photo-section-title">COLOR</p><label class="photo-adjustment"><span>Intensidad <output id="photo-vibrance-value">0</output></span><input data-photo-adjust="vibrance" type="range" min="-100" max="100" value="0" /></label><label class="photo-adjustment"><span>Tinte verde / magenta <output id="photo-tint-value">0</output></span><input data-photo-adjust="tint" type="range" min="-100" max="100" value="0" /></label><p class="photo-section-title">MEZCLA DE COLORES · HSL</p><div id="hsl-mix-controls">__HSL_CONTROLS__</div><p class="photo-section-title">EFECTOS</p><label class="photo-adjustment"><span>Viñeta <output id="photo-vignette-value">0</output></span><input data-photo-adjust="vignette" type="range" min="0" max="100" value="0" /></label><label class="photo-adjustment"><span>Grano <output id="photo-grain-value">0</output></span><input data-photo-adjust="grain" type="range" min="0" max="100" value="0" /></label><label class="photo-adjustment"><span>Exposición <output id="photo-exposure-value">0</output></span><input data-photo-adjust="exposure" type="range" min="-80" max="80" value="0" /></label><label class="photo-adjustment"><span>Contraste <output id="photo-contrast-value">0</output></span><input data-photo-adjust="contrastAmount" type="range" min="-60" max="80" value="0" /></label><label class="photo-adjustment"><span>Saturación <output id="photo-saturation-value">0</output></span><input data-photo-adjust="saturationAmount" type="range" min="-100" max="100" value="0" /></label><label class="photo-adjustment"><span>Temperatura cálida <output id="photo-warmth-value">0</output></span><input data-photo-adjust="warmth" type="range" min="0" max="100" value="0" /></label></div></aside>
      <section class="editor-area">
        <div class="editor-toolbar">
          <div class="toolbar-context"><span class="context-kicker">TU ESPACIO CREATIVO</span><strong id="tool-label">Seleccionar</strong></div>
          <div class="toolbar-options"><div class="lasso-actions" id="lasso-actions" hidden><button type="button" id="lasso-move-top" aria-pressed="false">↔ Mover lazo</button><button type="button" id="lasso-copy-top">Copiar lazo</button><button type="button" id="lasso-hide-top" title="Ocultar contorno">Ocultar</button></div>
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
          <div id="lasso-layer-panel" class="lasso-layer-panel" hidden><div class="lasso-panel-heading"><span>Selecciones de lazo</span><button type="button" id="lasso-clear" title="Quitar selección activa">Quitar</button></div><p class="lasso-panel-note">Cada lazo es una selección independiente. Activa uno para moverlo o crear una copia sin mover la imagen.</p><div id="lasso-layer-list"></div><div class="lasso-layer-actions"><button type="button" id="lasso-move" aria-pressed="false">↔ Mover lazo</button><button type="button" id="lasso-duplicate">＋ Copiar lazo</button></div></div>
          <div id="layer-properties" class="layer-properties" hidden>
            <label class="field-label" for="layer-name-input">Nombre de capa</label>
            <input class="text-field" id="layer-name-input" maxlength="60" value="" />
            <label class="opacity-label" for="layer-opacity"><span>Opacidad</span><output id="opacity-value">100%</output></label>
            <input id="layer-opacity" class="opacity-slider" type="range" min="0" max="100" value="100" />
            <div class="layer-actions">
              <button type="button" id="layer-up" title="Subir capa">↑ Orden</button>
              <button type="button" id="layer-down" title="Bajar capa">↓ Orden</button>
              <button type="button" id="layer-duplicate" title="Duplicar capa (Ctrl+D)">Duplicar</button>
              <button type="button" id="layer-delete" title="Eliminar capa">Eliminar</button>
            </div>
            <label id="shape-fill-control" class="shape-fill-control" hidden><input id="shape-fill" type="checkbox" /> Rellenar forma con el color actual</label>
            <div id="image-filter-control" class="image-filter-control" hidden><label class="field-label" for="image-filter">Filtro preestablecido</label><select id="image-filter" class="text-field"><option value="none">Original</option><option value="grayscale">Blanco y negro</option><option value="sepia">Sepia</option><option value="contrast">Contraste</option><option value="saturate">Color intenso</option><option value="blur">Desenfoque suave</option></select><p class="filter-note">Los ajustes se conservan al guardar y exportar el proyecto.</p></div>
            <button type="button" id="edit-text" class="edit-text-button" hidden>Editar contenido del texto</button>
          </div>
          <p class="layers-note">Selecciona una capa para moverla, renombrarla, ajustar su opacidad o cambiar su orden.</p>
        </section>
        <div class="inspector-bottom"><span class="inspector-star">✳</span><p><strong>Un espacio, infinitas posibilidades.</strong><span>Tu creatividad marca el límite.</span></p></div>
      </aside>
    </main>
    <input type="file" id="file-input" accept="image/*" hidden />
    <input type="file" id="project-file-input" accept=".lienzo,.json,application/json" hidden />
    <div class="toast" id="toast" role="status" aria-live="polite"></div>
    <div class="mobile-bottom"><button data-tool="select" class="mobile-tool active">↖<span>Elegir</span></button><button data-tool="pen" class="mobile-tool">✎<span>Pincel</span></button><button data-tool="eraser" class="mobile-tool">⌫<span>Borrar</span></button><button data-tool="text" class="mobile-tool">T<span>Texto</span></button><button id="mobile-more" class="mobile-tool">•••<span>Más</span></button></div>
  </div>
`;
const hslHost = document.querySelector<HTMLDivElement>('#hsl-mix-controls');
if (hslHost) { hslHost.innerHTML = hslColors.map(color => '<details class="hsl-color" data-hsl-family="' + color.key + '"><summary><span data-hsl-preview="' + color.key + '" class="hsl-dot hsl-' + color.key + '"></span>' + color.label + '</summary>' + (['h','s','l'] as const).map((axis,i) => '<label>' + ['Tono','Saturación','Luminancia'][i] + ' <output id="hsl-' + color.key + '-' + axis + '">0</output><input data-hsl-color="' + color.key + '" data-hsl-axis="' + axis + '" type="range" min="-100" max="100" value="0" /></label>').join('') + '</details>').join(''); hslHost.querySelectorAll<HTMLInputElement>('[data-hsl-color]').forEach(updateHslSliderTrack); }

document.querySelector<HTMLButtonElement>('#photo-panel-close')?.addEventListener('click',()=>{const panel=document.querySelector<HTMLElement>('#photo-panel');if(panel)panel.hidden=true;document.querySelectorAll<HTMLButtonElement>('[data-photo-jump]').forEach(button=>button.classList.remove('active'));activePhotoSection=null;redraw();});
document.querySelectorAll<HTMLButtonElement>('[data-photo-jump]').forEach(button=>button.addEventListener('click',()=>{const key=button.dataset.photoJump??'';const imageItem=items.find(item=>item.id===selectedId&&item.kind==='image') as ImageItem|undefined;if(!imageItem){showToast('Selecciona primero una capa de imagen para editar '+key.toLowerCase());return;}activePhotoSection=key;const photoPanel=document.querySelector<HTMLElement>('#photo-panel');if(photoPanel)photoPanel.hidden=false;const photoTitle=document.querySelector<HTMLElement>('#photo-panel-title');if(photoTitle)photoTitle.textContent=key;const active=lassoSelections.find(selection=>selection.id===activeLassoId)??lassoSelections[lassoSelections.length-1];if(active){activeLassoId=active.id;lassoPoints=active.points.map(p=>({...p}));hiddenLassoIds.delete(active.id);}const target=Array.from(document.querySelectorAll<HTMLElement>('.photo-section-title')).find(el=>el.textContent?.includes(key));if(target){target.scrollIntoView({behavior:'smooth',block:'start'});target.classList.add('photo-section-focus');window.setTimeout(()=>target.classList.remove('photo-section-focus'),900);}document.querySelectorAll<HTMLButtonElement>('[data-photo-jump]').forEach(b=>b.classList.toggle('active',b===button));redraw();}));
const canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;
const ctx = canvas.getContext('2d')!;
const hint = document.querySelector<HTMLDivElement>('#paper-hint')!;
const colorInput = document.querySelector<HTMLInputElement>('#color')!;
const sizeInput = document.querySelector<HTMLInputElement>('#brush-size')!;
const sizeValue = document.querySelector<HTMLOutputElement>('#size-value')!;
const colorValue = document.querySelector<HTMLSpanElement>('#color-value')!;
const toast = document.querySelector<HTMLDivElement>('#toast')!;
const fileInput = document.querySelector<HTMLInputElement>('#file-input')!;
let lassoPoints: Point[] = [];
let lassoSelections: { id: string; name: string; points: Point[] }[] = [];
let activeLassoId: string | null = null;
let hiddenLassoIds = new Set<string>();
let lassoMoveMode = false;
let lassoDragOrigin: Point[] | null = null;
let lassoDrawing = false;
let activePhotoSection: string | null = null;
let photoCommitVersion = 0;
let projectRestoreVersion = 0;
let tool: Tool = 'select';
let items: Item[] = [];
let history: Item[][] = [[]];
type LassoHistoryState = { selections: { id: string; name: string; points: Point[] }[]; activeId: string | null; points: Point[]; hiddenIds: string[] };
let lassoHistory: LassoHistoryState[] = [{ selections: [], activeId: null, points: [], hiddenIds: [] }];
let historyIndex = 0;
let selectedId: string | null = null;
let dragStart: Point | null = null;
let dragOrigin: Item | null = null;
let hasMoved = false;
let resizing = false;
let resizeHandle: ResizeHandle | null = null;
function makeMeta(): LayerMeta { return { id: crypto.randomUUID(), opacity: 1, visible: true }; }
function cloneItem(item: Item): Item { return { ...item, ...(item.kind === 'image' && item.maskPoints ? { maskPoints: item.maskPoints.map(p => ({ ...p })) } : {}), ...(item.kind === 'image' && item.hslMix ? { hslMix: Object.fromEntries(Object.entries(item.hslMix).map(([k,v]) => [k, v ? { ...v } : v])) as ImageItem['hslMix'] } : {}), ...(item.kind === 'stroke' ? { points: item.points.map(p => ({ ...p })) } : {}), ...(item.kind === 'shape' ? { from: { ...item.from }, to: { ...item.to } } : {}), ...(item.kind === 'text' ? { at: { ...item.at } } : {}) }; }
let activeStroke: Stroke | null = null;
let shapeStart: Point | null = null;
let previewShape: Shape | null = null;
let toastTimer = 0;

function pointFromEvent(event: MouseEvent, rect: DOMRect = canvas.getBoundingClientRect()): Point {
  return { x: Math.max(0, Math.min(canvas.width, (event.clientX - rect.left) * canvas.width / rect.width)), y: Math.max(0, Math.min(canvas.height, (event.clientY - rect.top) * canvas.height / rect.height)) };
}
function rgbToHsl(r:number,g:number,b:number):[number,number,number]{r/=255;g/=255;b/=255;const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,l=(max+min)/2;let h=0,ss=0;if(d){ss=d/(1-Math.abs(2*l-1));if(max===r)h=((g-b)/d)%6;else if(max===g)h=(b-r)/d+2;else h=(r-g)/d+4;h*=60;if(h<0)h+=360;}return[h,ss,l];}
function hslToRgb(h:number,ss:number,l:number):[number,number,number]{const c=(1-Math.abs(2*l-1))*ss,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;let r=0,g=0,b=0;if(h<60){r=c;g=x;}else if(h<120){r=x;g=c;}else if(h<180){g=c;b=x;}else if(h<240){g=x;b=c;}else if(h<300){r=x;b=c;}else{r=c;b=x;}return[Math.round((r+m)*255),Math.round((g+m)*255),Math.round((b+m)*255)];}
function hueDistance(a:number,b:number):number{const d=Math.abs(a-b)%360;return Math.min(d,360-d);}
function hueShiftForColor(color:HslColor,value:number):number{const neighbors=hslHueNeighbors[color],base=hslBaseHue[color];const target=value<0?neighbors[0]:neighbors[1];const distance=hueDistance(base,target);return (value<0?-1:1)*distance*Math.min(100,Math.abs(value))/100;}
function pointInLasso(x:number,y:number,polygon:Point[]=lassoPoints):boolean{if(polygon.length<3)return true;let inside=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i]!,b=polygon[j]!;if(((a.y>y)!==(b.y>y))&&(x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x))inside=!inside;}return inside;}
let photoPreviewScale = 1;
const processedImageCache = new WeakMap<ImageItem, { image: HTMLImageElement; key: string; canvas: HTMLCanvasElement }>();
function renderHslImage(item:ImageItem):HTMLCanvasElement{
  const scale = photoPreviewScale;
  const width=Math.max(1,Math.round(item.width*scale)),height=Math.max(1,Math.round(item.height*scale));
  const activeMask=lassoPoints.length>=3?lassoPoints:(item.maskPoints??[]);
  let maskHash=2166136261;
  for(const point of activeMask){maskHash=Math.imul(maskHash^Math.round(point.x*10),16777619);maskHash=Math.imul(maskHash^Math.round(point.y*10),16777619);}
  const key=JSON.stringify([scale,width,height,item.filter,item.exposure,item.contrastAmount,item.saturationAmount,item.warmth,item.highlights,item.shadows,item.whites,item.blacks,item.vibrance,item.tint,item.hslMix,activeLassoId,activeMask.length,maskHash>>>0]);
  const cached=processedImageCache.get(item);
  if(cached&&cached.image===item.image&&cached.key===key)return cached.canvas;
  const off=document.createElement('canvas');off.width=width;off.height=height;
  const oc=off.getContext('2d',{willReadFrequently:true});if(!oc)return off;oc.drawImage(item.image,0,0,off.width,off.height);
  const imageData=oc.getImageData(0,0,off.width,off.height),data=imageData.data;
  let maskPixels:Uint8ClampedArray|null=null;
  if(activeMask.length>=3){
    const maskCanvas=document.createElement('canvas');maskCanvas.width=off.width;maskCanvas.height=off.height;
    const maskCtx=maskCanvas.getContext('2d');
    if(maskCtx){maskCtx.scale(off.width/Math.max(1,item.width),off.height/Math.max(1,item.height));maskCtx.translate(-item.x,-item.y);maskCtx.beginPath();maskCtx.moveTo(activeMask[0]!.x,activeMask[0]!.y);for(let i=1;i<activeMask.length;i++)maskCtx.lineTo(activeMask[i]!.x,activeMask[i]!.y);maskCtx.closePath();maskCtx.fillStyle='#fff';maskCtx.fill();maskPixels=maskCtx.getImageData(0,0,off.width,off.height).data;}
  }
  const exposure=Math.pow(2,(item.exposure??0)/40),contrast=1+(item.contrastAmount??0)/100,saturation=1+(item.saturationAmount??0)/100,warmth=(item.warmth??0)/100,tint=(item.tint??0)/100,vibrance=(item.vibrance??0)/100;
  const highlights=(item.highlights??0)/100,shadows=(item.shadows??0)/100,whites=(item.whites??0)/100,blacks=(item.blacks??0)/100;
  const cs:{key:HslColor;center:number;range:number}[]=[{key:'red',center:0,range:25},{key:'orange',center:30,range:22},{key:'yellow',center:60,range:25},{key:'green',center:120,range:38},{key:'aqua',center:180,range:28},{key:'blue',center:220,range:35},{key:'purple',center:270,range:28},{key:'magenta',center:320,range:25}];
  for(let i=0;i<data.length;i+=4){
    if(data[i+3]===0)continue;
    const pixel=i/4;
    if(maskPixels&&maskPixels[pixel*4+3]===0)continue;
    let r=data[i]!/255,g=data[i+1]!/255,b=data[i+2]!/255;
    r*=exposure*(1+warmth*.22+tint*.08);g*=exposure*(1-tint*.12);b*=exposure*(1-warmth*.22+tint*.08);
    r=Math.max(0,Math.min(1,r));g=Math.max(0,Math.min(1,g));b=Math.max(0,Math.min(1,b));
    let [h,ss,l]=rgbToHsl(r*255,g*255,b*255);
    const shadowWeight=Math.pow(1-l,2),highlightWeight=Math.pow(l,2),whiteWeight=Math.max(0,(l-.65)/.35),blackWeight=Math.max(0,(.35-l)/.35);
    l+=shadows*shadowWeight*.45+highlights*highlightWeight*.38+whites*whiteWeight*.32-blacks*blackWeight*.32;
    l=Math.max(0,Math.min(1,(l-.5)*contrast+.5));
    ss=Math.max(0,Math.min(1,ss*(saturation+vibrance*(1-ss))));
    let dh=0,ds=0,dl=0;
    for(const c of cs){const v=item.hslMix?.[c.key];if(!v)continue;const distance=hueDistance(h,c.center);if(distance>=c.range)continue;const w=(1+Math.cos(Math.PI*distance/c.range))/2;dh+=hueShiftForColor(c.key,v.h)*w;ds+=v.s/100*w;dl+=v.l/100*w;}
    let rgb=hslToRgb((h+dh+360)%360,Math.max(0,Math.min(1,ss*(1+ds))),Math.max(0,Math.min(1,l+dl*.45)));
    if(item.filter==='grayscale'){const y=.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];rgb=[y,y,y];}
    else if(item.filter==='sepia'){const [rr,gg,bb]=rgb;rgb=[Math.min(255,rr*.393+gg*.769+bb*.189),Math.min(255,rr*.349+gg*.686+bb*.168),Math.min(255,rr*.272+gg*.534+bb*.131)];}
    else if(item.filter==='contrast'){rgb=rgb.map(v=>Math.max(0,Math.min(255,(v-128)*1.25+128))) as [number,number,number];}
    else if(item.filter==='saturate'){const [hh,sss,ll]=rgbToHsl(rgb[0],rgb[1],rgb[2]);rgb=hslToRgb(hh,Math.min(1,sss*1.6),ll);}
    data[i]=rgb[0];data[i+1]=rgb[1];data[i+2]=rgb[2];
  }
  oc.putImageData(imageData,0,0);processedImageCache.set(item,{image:item.image,key,canvas:off});return off;
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
    const hasAdjustments = (item.filter !== 'none' && item.filter !== 'blur') || [item.exposure,item.contrastAmount,item.saturationAmount,item.warmth,item.highlights,item.shadows,item.whites,item.blacks,item.vibrance,item.tint].some(v => typeof v === 'number' && v !== 0) || (!!item.hslMix && Object.values(item.hslMix).some(v => !!v && (v.h !== 0 || v.s !== 0 || v.l !== 0)));
    const processed = hasAdjustments ? renderHslImage(item) : item.image;
    const localMask = lassoPoints.length >= 3 ? lassoPoints : item.maskPoints;
    target.filter = 'none';
    if (item.filter === 'blur' && localMask && localMask.length >= 3) {
      target.drawImage(processed, item.x, item.y, item.width, item.height);
      target.save(); target.beginPath(); target.moveTo(localMask[0]!.x,localMask[0]!.y); localMask.slice(1).forEach(point=>target.lineTo(point.x,point.y)); target.closePath(); target.clip(); target.filter='blur(2px)'; target.drawImage(processed,item.x,item.y,item.width,item.height); target.restore(); target.filter='none';
    } else {
      target.filter = item.filter === 'blur' ? 'blur(2px)' : 'none';
      target.drawImage(processed, item.x, item.y, item.width, item.height);
      target.filter = 'none';
    }
    target.save();
    if(localMask&&localMask.length>=3){target.beginPath();target.moveTo(localMask[0]!.x,localMask[0]!.y);localMask.slice(1).forEach(point=>target.lineTo(point.x,point.y));target.closePath();target.clip();}
    if ((item.vignette ?? 0) > 0) { const amount = (item.vignette ?? 0) / 100; const gradient = target.createRadialGradient(item.x + item.width / 2, item.y + item.height / 2, Math.min(item.width, item.height) * 0.12, item.x + item.width / 2, item.y + item.height / 2, Math.max(item.width, item.height) * 0.72); gradient.addColorStop(0, 'rgba(0,0,0,0)'); gradient.addColorStop(1, `rgba(0,0,0,${amount * 0.72})`); target.save(); target.fillStyle = gradient; target.fillRect(item.x, item.y, item.width, item.height); target.restore(); }
    if ((item.grain ?? 0) > 0) { const amount = (item.grain ?? 0) / 100; const step = Math.max(3, Math.round(7 - amount * 4)); target.save(); target.globalAlpha *= amount * 0.22; for (let y = item.y; y < item.y + item.height; y += step) for (let x = item.x; x < item.x + item.width; x += step) { const noise = ((Math.imul(Math.floor(x) + 1, 374761393) ^ Math.imul(Math.floor(y) + 1, 668265263)) >>> 0) % 2 ? 255 : 0; target.fillStyle = `rgb(${noise},${noise},${noise})`; target.fillRect(x, y, step * 0.45, step * 0.45); } target.restore(); }
    target.restore();
    target.filter = 'none';
  }
  target.restore();
}
let redrawFrame = 0;
let pendingPanelRefresh = false;
function scheduleRedraw(updatePanels = false): void {
  pendingPanelRefresh ||= updatePanels;
  if (redrawFrame) return;
  redrawFrame = requestAnimationFrame(() => {
    redrawFrame = 0;
    const refreshPanels = pendingPanelRefresh;
    pendingPanelRefresh = false;
    redraw(refreshPanels);
  });
}
function redraw(updatePanels = true): void {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  items.forEach(item => paintItem(item));
  if (activeStroke) paintItem(activeStroke);
  if (previewShape) { ctx.save(); ctx.globalAlpha = 0.72; paintItem(previewShape); ctx.restore(); }
  const showLassoOverlay = tool === 'lasso' || lassoMoveMode || activePhotoSection !== null;
  const allLassos = showLassoOverlay ? (lassoSelections.length ? lassoSelections : (lassoPoints.length >= 3 ? [{id:'active',name:'Selección actual',points:lassoPoints}] : [])).filter(selection=>!hiddenLassoIds.has(selection.id)) : [];
  allLassos.forEach(selection => { const active = selection.id === activeLassoId || (selection.id === 'active' && !activeLassoId); if (selection.points.length < 2) return; ctx.save(); ctx.beginPath(); ctx.moveTo(selection.points[0]!.x, selection.points[0]!.y); selection.points.slice(1).forEach(p => ctx.lineTo(p.x, p.y)); if (!lassoDrawing) ctx.closePath(); ctx.strokeStyle = active ? '#7659ed' : '#44c7c0'; ctx.lineWidth = active ? 2.5 : 1.5; ctx.setLineDash(active ? [8,4] : [4,4]); ctx.stroke(); ctx.setLineDash([]); if (!lassoDrawing && active) { ctx.fillStyle = 'rgba(128,101,237,0.10)'; ctx.fill(); } ctx.restore(); });
  if(showLassoOverlay&&lassoDrawing&&lassoPoints.length>1){ctx.save();ctx.beginPath();ctx.moveTo(lassoPoints[0]!.x,lassoPoints[0]!.y);lassoPoints.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));ctx.strokeStyle='#a18bff';ctx.lineWidth=2;ctx.setLineDash([5,3]);ctx.stroke();ctx.restore();}
  if (updatePanels) renderLassoLayers();
  const selected = items.find(item => item.id === selectedId && item.visible);
  // Keep the selected layer available for photo adjustments, but only show its
  // transform handles while the object-selection tool is active.
  if (selected && tool === 'select' && !lassoMoveMode) drawSelection(selected);
  hint.classList.toggle('hidden', items.length > 0 || !!activeStroke);
  if (updatePanels) { renderLayers(); renderLayerProperties(); }
}
function syncActiveLasso(): void { const active=lassoSelections.find(selection=>selection.id===activeLassoId); if(active) active.points=lassoPoints.map(p=>({...p})); }
function clearLassoSelections(message='Selección de lazo quitada'): void { lassoPoints=[];lassoSelections=[];hiddenLassoIds.clear();activeLassoId=null;lassoDrawing=false;lassoMoveMode=false;lassoDragOrigin=null;snapshot();const move=document.querySelector<HTMLButtonElement>('#lasso-move');const topMove=document.querySelector<HTMLButtonElement>('#lasso-move-top');[move,topMove].forEach(b=>{if(b){b.setAttribute('aria-pressed','false');b.classList.remove('active');}});redraw();showToast(message); }
function hideAppliedLasso(message:string): void { lassoSelections.forEach(selection=>hiddenLassoIds.add(selection.id)); if(activeLassoId)hiddenLassoIds.add(activeLassoId); lassoPoints=[];activeLassoId=null;lassoDrawing=false;lassoMoveMode=false;lassoDragOrigin=null;const move=document.querySelector<HTMLButtonElement>('#lasso-move');const topMove=document.querySelector<HTMLButtonElement>('#lasso-move-top');[move,topMove].forEach(b=>{if(b){b.setAttribute('aria-pressed','false');b.classList.remove('active');}});redraw();showToast(message+'; el lazo queda guardado en Selecciones'); }
function activateLasso(id:string): void { const selection=lassoSelections.find(entry=>entry.id===id);if(!selection)return;hiddenLassoIds.delete(id);activeLassoId=id;lassoPoints=selection.points.map(p=>({...p}));redraw(); }
function commitPhotoAdjustments(item:ImageItem,message:string): void {
  photoPreviewScale = 1;
  if(!item.visible){showToast('Activa la capa de imagen antes de aplicar ajustes');return;}
  const commitVersion=++photoCommitVersion;
  const width=Math.max(1,Math.ceil(item.width)),height=Math.max(1,Math.ceil(item.height));
  const local=document.createElement('canvas');local.width=width;local.height=height;
  const localContext=local.getContext('2d');
  if(!localContext){showToast('No se pudo preparar la imagen ajustada');return;}
  const lassoAtStart=lassoPoints.map(point=>({...point}));
  const activeAtStart=activeLassoId;
  const previousOpacity=item.opacity;item.opacity=1;
  try { localContext.translate(-item.x,-item.y);paintItem(item,localContext); }
  catch(error) { console.error('No se pudo procesar el ajuste local:',error);showToast('No se pudo aplicar el ajuste');return; }
  finally { item.opacity=previousOpacity; }
  let dataUrl:string;
  try { dataUrl=local.toDataURL('image/png'); }
  catch(error) { console.error('No se pudo exportar el ajuste:',error);showToast('No se pudo guardar el resultado del ajuste');return; }
  const hasLocalSelection=activeAtStart!==null&&lassoAtStart.length>=3;
  if(hasLocalSelection){
    // The adjustment renderer produces a full-image preview. Blend it back through
    // the active lasso so pixels outside the selection remain untouched.
    const composite=document.createElement('canvas');composite.width=width;composite.height=height;
    const compositeContext=composite.getContext('2d');
    if(!compositeContext){showToast('No se pudo preparar la máscara de la selección');return;}
    compositeContext.drawImage(item.image,0,0,width,height);
    compositeContext.save();
    compositeContext.beginPath();
    compositeContext.moveTo(lassoAtStart[0]!.x-item.x,lassoAtStart[0]!.y-item.y);
    lassoAtStart.slice(1).forEach(point=>compositeContext.lineTo(point.x-item.x,point.y-item.y));
    compositeContext.closePath();compositeContext.clip();
    try { compositeContext.drawImage(local,0,0,width,height); }
    catch(error) { console.error('No se pudo mezclar el ajuste local:',error);showToast('No se pudo aplicar el ajuste a la selección');return; }
    compositeContext.restore();
    try { dataUrl=composite.toDataURL('image/png'); }
    catch(error) { console.error('No se pudo exportar la selección ajustada:',error);showToast('No se pudo guardar el resultado de la selección');return; }
  }
  const baked=new Image();
  baked.onload=()=>{
    const currentLassoMatches=activeLassoId===activeAtStart&&lassoPoints.length===lassoAtStart.length&&lassoPoints.every((point,index)=>point.x===lassoAtStart[index]!.x&&point.y===lassoAtStart[index]!.y);
    if(commitVersion!==photoCommitVersion||!items.includes(item)||selectedId!==item.id||!currentLassoMatches){showToast('El ajuste no se aplicó porque cambió la capa o la selección; vuelve a aplicarlo');return;}
    item.image=baked;
    item.filter='none';
    item.exposure=0;item.contrastAmount=0;item.saturationAmount=0;item.warmth=0;
    item.highlights=0;item.shadows=0;item.whites=0;item.blacks=0;
    item.vibrance=0;item.tint=0;item.vignette=0;item.grain=0;
    item.hslMix={};
    item.maskPoints=undefined;
    const filter=document.querySelector<HTMLSelectElement>('#image-filter');if(filter)filter.value='none';
    document.querySelectorAll<HTMLInputElement>('[data-photo-adjust]').forEach(input=>{input.value='0';const output=input.closest('label')?.querySelector('output');if(output)output.textContent='0';});
    document.querySelectorAll<HTMLInputElement>('[data-hsl-color]').forEach(input=>{input.value='0';const output=document.querySelector<HTMLOutputElement>('#hsl-'+input.dataset.hslColor+'-'+input.dataset.hslAxis);if(output)output.value='0';});
    hideAppliedLasso(message);
    snapshot();
    renderLayerProperties();
    redraw();
  };
  baked.onerror=()=>{showToast('No se pudo finalizar el ajuste; tus controles se conservaron');};
  baked.src=dataUrl;
}
function renderLassoLayers(): void {
 const panel=document.querySelector<HTMLDivElement>('#lasso-layer-panel');const list=document.querySelector<HTMLDivElement>('#lasso-layer-list');const actions=document.querySelector<HTMLDivElement>('#lasso-actions');
 if(panel)panel.hidden=lassoSelections.length===0;if(actions)actions.hidden=lassoSelections.length===0;if(!list)return;list.innerHTML='';
 lassoSelections.slice().reverse().forEach(selection=>{const row=document.createElement('button');row.type='button';row.className='lasso-layer-row'+(selection.id===activeLassoId?' selected':'');row.innerHTML='<span class="lasso-layer-icon">⌁</span><span></span>';const label=row.querySelector('span:nth-child(2)');if(label)label.textContent=selection.name;row.title='Seleccionar '+selection.name;row.addEventListener('click',()=>activateLasso(selection.id));list.append(row);});
 const move=document.querySelector<HTMLButtonElement>('#lasso-move');const topMove=document.querySelector<HTMLButtonElement>('#lasso-move-top');[move,topMove].forEach(b=>{if(b){b.setAttribute('aria-pressed',String(lassoMoveMode));b.classList.toggle('active',lassoMoveMode);}});
}
function captureLassoHistory(): LassoHistoryState {
  return {
    selections: lassoSelections.map(selection => ({ id: selection.id, name: selection.name, points: selection.points.map(point => ({ ...point })) })),
    activeId: activeLassoId,
    points: lassoPoints.map(point => ({ ...point })),
    hiddenIds: Array.from(hiddenLassoIds)
  };
}
function restoreLassoHistory(state: LassoHistoryState | undefined): void {
  const saved = state ?? { selections: [], activeId: null, points: [], hiddenIds: [] };
  lassoSelections = saved.selections.map(selection => ({ id: selection.id, name: selection.name, points: selection.points.map(point => ({ ...point })) }));
  activeLassoId = lassoSelections.some(selection => selection.id === saved.activeId) ? saved.activeId : null;
  lassoPoints = saved.points.map(point => ({ ...point }));
  hiddenLassoIds = new Set(saved.hiddenIds.filter(id => lassoSelections.some(selection => selection.id === id)));
  lassoDrawing = false; lassoMoveMode = false; lassoDragOrigin = null;
  renderLassoLayers();
}
function snapshot(): void {
  history = history.slice(0, historyIndex + 1);
  lassoHistory = lassoHistory.slice(0, historyIndex + 1);
  history.push(items.map(cloneItem));
  lassoHistory.push(captureLassoHistory());
  historyIndex = history.length - 1;
  if (history.length > 101) { history.shift(); lassoHistory.shift(); historyIndex--; }
  updateHistoryButtons(); document.querySelector('#save-status')!.textContent = 'Cambios sin guardar';
}
function updateHistoryButtons(): void {
  document.querySelector<HTMLButtonElement>('#undo')!.disabled = historyIndex <= 0;
  document.querySelector<HTMLButtonElement>('#redo')!.disabled = historyIndex >= history.length - 1;
}
function commitItem(item: Item): void { items.push(item); selectedId = item.id; snapshot(); redraw(); }
function undo(): void {
  if (historyIndex <= 0) return;
  historyIndex--;
  items = history[historyIndex]!.map(cloneItem);
  restoreLassoHistory(lassoHistory[historyIndex]);
  selectedId = items.some(item => item.id === selectedId) ? selectedId : null;
  redraw(); updateHistoryButtons(); showToast('Última acción deshecha');
}
function redo(): void {
  if (historyIndex >= history.length - 1) return;
  historyIndex++;
  items = history[historyIndex]!.map(cloneItem);
  restoreLassoHistory(lassoHistory[historyIndex]);
  selectedId = items.some(item => item.id === selectedId) ? selectedId : null;
  redraw(); updateHistoryButtons(); showToast('Acción restaurada');
}
function showToast(message: string): void {
  toast.textContent = message; toast.classList.add('visible');
  window.clearTimeout(toastTimer); toastTimer = window.setTimeout(() => toast.classList.remove('visible'), 2400);
}
function setTool(next: Tool): void {
  tool = next;
  document.querySelectorAll<HTMLElement>('[data-tool]').forEach(el => el.classList.toggle('active', el.dataset.tool === next));
  const labels: Record<Tool, string> = { select: 'Seleccionar', lasso: 'Lazo de área', pen: 'Pincel', eraser: 'Borrador', line: 'Línea', rect: 'Rectángulo', ellipse: 'Elipse', text: 'Texto' };
  document.querySelector('#tool-label')!.textContent = labels[next];
  document.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach(button => {
    if (button.dataset.tool === next) button.setAttribute('aria-pressed', 'true');
    else button.setAttribute('aria-pressed', 'false');
  });
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
  if (item.kind === 'text') { ctx.save(); ctx.font = `600 ${item.size}px sans-serif`; let w=30; for(const line of item.text.split('\n'))w=Math.max(w,ctx.measureText(line).width); ctx.restore(); return { x: item.at.x, y: item.at.y, w, h: item.size * 1.3 * item.text.split('\n').length }; }
  if (item.kind === 'image') return { x: item.x, y: item.y, w: item.width, h: item.height };
  if (item.kind === 'shape') return { x: Math.min(item.from.x, item.to.x), y: Math.min(item.from.y, item.to.y), w: Math.max(1, Math.abs(item.to.x-item.from.x)), h: Math.max(1, Math.abs(item.to.y-item.from.y)) };
  if(!item.points.length)return{x:0,y:0,w:1,h:1};
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  for(const point of item.points){if(point.x<minX)minX=point.x;if(point.x>maxX)maxX=point.x;if(point.y<minY)minY=point.y;if(point.y>maxY)maxY=point.y;}
  const pad=Math.max(8,item.width);
  return{x:minX-pad,y:minY-pad,w:Math.max(1,maxX-minX+pad*2),h:Math.max(1,maxY-minY+pad*2)};
}
function drawSelection(item: Item): void {
  const b = bounds(item); ctx.save(); ctx.strokeStyle = '#8065ed'; ctx.lineWidth = 2; ctx.setLineDash([7,4]); ctx.strokeRect(b.x-5,b.y-5,b.w+10,b.h+10); ctx.setLineDash([]); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#8065ed';
  [[b.x-5,b.y-5],[b.x+b.w+5,b.y-5],[b.x-5,b.y+b.h+5],[b.x+b.w+5,b.y+b.h+5]].forEach(([x,y])=>{ctx.beginPath();ctx.rect(x-4,y-4,8,8);ctx.fill();ctx.stroke();}); ctx.restore();
}
function renderLayerProperties(): void {
  const item = items.find(candidate => candidate.id === selectedId);
  const controls = document.querySelector<HTMLDivElement>('#layer-properties'); if (!controls) return;
  controls.hidden = !item;
  const photoPanelControls = document.querySelector<HTMLDivElement>('#photo-adjustments-panel');
  if (photoPanelControls) photoPanelControls.hidden = !item || item.kind !== 'image';
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
    if (item.kind === 'image') document.querySelectorAll<HTMLInputElement>('[data-hsl-color]').forEach(input => { const color=input.dataset.hslColor as HslColor; const axis=input.dataset.hslAxis as 'h'|'s'|'l'; const value=item.hslMix?.[color]?.[axis]??0; input.value=String(value); const output=document.querySelector<HTMLOutputElement>('#hsl-'+color+'-'+axis); if(output)output.value=(value>0?'+':'')+value; const dot=document.querySelector<HTMLElement>('[data-hsl-preview="'+color+'"]');if(dot){const mix=item.hslMix?.[color]??{h:0,s:0,l:0};dot.style.backgroundColor='hsl('+((hslBaseHue[color]+hueShiftForColor(color,mix.h)+360)%360)+' '+Math.max(0,Math.min(100,50+mix.s*.5))+'% '+Math.max(5,Math.min(95,50+mix.l*.35))+'%)';} });
    const photoValues: Record<string, number> = { exposure: item.exposure ?? 0, contrastAmount: item.contrastAmount ?? 0, saturationAmount: item.saturationAmount ?? 0, warmth: item.warmth ?? 0, highlights: item.highlights ?? 0, shadows: item.shadows ?? 0, whites: item.whites ?? 0, blacks: item.blacks ?? 0, vibrance: item.vibrance ?? 0, tint: item.tint ?? 0, vignette: item.vignette ?? 0, grain: item.grain ?? 0 };
    Object.entries(photoValues).forEach(([key, value]) => { const input = document.querySelector<HTMLInputElement>(`[data-photo-adjust="${key}"]`); const output = document.querySelector<HTMLOutputElement>(`#photo-${({contrastAmount:'contrast', saturationAmount:'saturation', warmth:'warmth', highlights:'highlights', shadows:'shadows', whites:'whites', blacks:'blacks', vibrance:'vibrance', tint:'tint', vignette:'vignette', grain:'grain'} as Record<string,string>)[key] ?? key}-value`); if (input && document.activeElement !== input) input.value = String(value); if (output) output.value = `${value > 0 ? '+' : ''}${value}`; });
  }
}
function moveItem(item: Item, dx: number, dy: number): void {
  if (item.kind === 'stroke') item.points = item.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
  else if (item.kind === 'shape') { item.from = { x: item.from.x + dx, y: item.from.y + dy }; item.to = { x: item.to.x + dx, y: item.to.y + dy }; }
  else if (item.kind === 'text') item.at = { x: item.at.x + dx, y: item.at.y + dy };
  else { item.x += dx; item.y += dy; }
}
function resizeBoundsFromHandle(original: {x:number;y:number;w:number;h:number}, handle: ResizeHandle, p: Point): {x:number;y:number;w:number;h:number} {
  const right=original.x+original.w, bottom=original.y+original.h;
  let left=original.x, top=original.y, nextRight=right, nextBottom=bottom;
  if(handle==='nw'||handle==='sw') left=Math.min(p.x,right-12);
  if(handle==='ne'||handle==='se') nextRight=Math.max(p.x,original.x+12);
  if(handle==='nw'||handle==='ne') top=Math.min(p.y,bottom-12);
  if(handle==='sw'||handle==='se') nextBottom=Math.max(p.y,original.y+12);
  return {x:left,y:top,w:Math.max(12,nextRight-left),h:Math.max(12,nextBottom-top)};
}
function resizeItemToBounds(item: Item, original: Item, next: {x:number;y:number;w:number;h:number}): void {
  const b=bounds(original), sx=next.w/Math.max(1,b.w), sy=next.h/Math.max(1,b.h);
  const map=(p:Point):Point=>({x:next.x+(p.x-b.x)*sx,y:next.y+(p.y-b.y)*sy});
  if(item.kind==='stroke'&&original.kind==='stroke'){
    item.points=original.points.map(map);
    item.width=Math.max(1,original.width*Math.min(sx,sy));
  }else if(item.kind==='shape'&&original.kind==='shape'){
    item.from=map(original.from);item.to=map(original.to);item.width=Math.max(1,original.width*Math.min(sx,sy));
  }else if(item.kind==='text'&&original.kind==='text'){
    item.at=map(original.at);item.size=Math.max(8,original.size*Math.max(.1,(sx+sy)/2));
  }else if(item.kind==='image'&&original.kind==='image'){
    item.x=next.x;item.y=next.y;item.width=next.w;item.height=next.h;
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
function duplicateSelected(): void {
  const source = items.find(item => item.id === selectedId);
  if (!source) { showToast('Selecciona una capa para duplicarla'); return; }
  const copy = cloneItem(source);
  copy.id = crypto.randomUUID();
  copy.name = `${layerName(source)} — copia`;
  moveItem(copy, 24, 24);
  const b = bounds(copy);
  if (b.x + b.w > canvas.width) moveItem(copy, canvas.width - (b.x + b.w), 0);
  if (b.y + b.h > canvas.height) moveItem(copy, 0, canvas.height - (b.y + b.h));
  items.push(copy);
  selectedId = copy.id;
  snapshot();
  redraw();
  showToast('Capa duplicada');
}
function deleteSelected(): void { const index = items.findIndex(item => item.id === selectedId); if (index < 0) return; items.splice(index,1); selectedId = null; snapshot(); redraw(); showToast('Capa eliminada'); }
canvas.addEventListener('pointerdown', event => {
  canvas.focus({ preventScroll: true });
  canvas.setPointerCapture(event.pointerId);
  const p = pointFromEvent(event);
  // A lasso is a temporary selection overlay: keep it only while editing that
  // area or dragging it, and clear it when the user starts working elsewhere.
  if (tool !== 'lasso' && lassoPoints.length && (!lassoMoveMode || !pointInLasso(p.x, p.y))) hideLassoOverlay();
  if(tool==='select'&&!lassoMoveMode)activePhotoSection=null;
  if (tool === 'lasso') { activePhotoSection=null; lassoSelections.forEach(selection=>hiddenLassoIds.add(selection.id)); lassoPoints = [p]; lassoDrawing = true; activeLassoId = null; lassoMoveMode = false; redraw(); return; }
  if (tool === 'select' && lassoMoveMode && activeLassoId && lassoPoints.length >= 3 && pointInLasso(p.x,p.y)) { dragStart=p;lassoDragOrigin=lassoPoints.map(point=>({...point}));hasMoved=false;selectedId=null;redraw();return; }
  if (tool === 'select') {
    const selected = items.find(item => item.id === selectedId && item.visible);
    if (selected) {
      const b = bounds(selected);
      const handles: {handle:ResizeHandle;x:number;y:number}[] = [
        {handle:'nw',x:b.x-5,y:b.y-5},{handle:'ne',x:b.x+b.w+5,y:b.y-5},
        {handle:'sw',x:b.x-5,y:b.y+b.h+5},{handle:'se',x:b.x+b.w+5,y:b.y+b.h+5}
      ];
      const handle=handles.find(candidate=>Math.abs(p.x-candidate.x)<=10&&Math.abs(p.y-candidate.y)<=10);
      if(handle){dragStart=p;dragOrigin=cloneItem(selected);resizing=true;resizeHandle=handle.handle;hasMoved=false;redraw();return;}
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
  const rect = canvas.getBoundingClientRect();
  const p = pointFromEvent(event, rect);
  if (tool === 'lasso' && lassoDrawing) {
    const events = typeof event.getCoalescedEvents === 'function' ? event.getCoalescedEvents() : [event];
    for (const sample of events) {
      const point = pointFromEvent(sample, rect);
      const last = lassoPoints[lassoPoints.length - 1];
      if (!last || Math.hypot(point.x - last.x, point.y - last.y) >= 0.8) lassoPoints.push(point);
    }
    scheduleRedraw(false);
  }
  else if (tool === 'select' && dragStart && lassoDragOrigin && lassoMoveMode) { const dx=p.x-dragStart.x,dy=p.y-dragStart.y;if(Math.abs(dx)+Math.abs(dy)>1)hasMoved=true;lassoPoints=lassoDragOrigin.map(point=>({x:Math.max(0,Math.min(canvas.width,point.x+dx)),y:Math.max(0,Math.min(canvas.height,point.y+dy))}));syncActiveLasso();scheduleRedraw(false); }
  else if (tool === 'select' && dragStart && selectedId) {
    const item = items.find(candidate => candidate.id === selectedId); if (!item) return;
    const dx = p.x - dragStart.x, dy = p.y - dragStart.y;
    if (Math.abs(dx) + Math.abs(dy) > 1) hasMoved = true;
    if (dragOrigin) {
      const origin = cloneItem(dragOrigin);
      if (resizing && resizeHandle) {
        resizeItemToBounds(origin, dragOrigin, resizeBoundsFromHandle(bounds(dragOrigin), resizeHandle, p));
      } else moveItem(origin, dx, dy);
      Object.assign(item, origin); scheduleRedraw(false);
    }
  } else if (tool === 'select') {
    const selected = items.find(item => item.id === selectedId && item.visible);
    if (selected) { const b=bounds(selected);const handles: {x:number;y:number;cursor:string}[]=[{x:b.x-5,y:b.y-5,cursor:'nwse-resize'},{x:b.x+b.w+5,y:b.y-5,cursor:'nesw-resize'},{x:b.x-5,y:b.y+b.h+5,cursor:'nesw-resize'},{x:b.x+b.w+5,y:b.y+b.h+5,cursor:'nwse-resize'}];const handle=handles.find(candidate=>Math.abs(p.x-candidate.x)<=10&&Math.abs(p.y-candidate.y)<=10);canvas.style.cursor=handle?.cursor??(hitTest(p)?'move':'default'); }
    else canvas.style.cursor = 'default';
  } else if (activeStroke) {
    const events = typeof event.getCoalescedEvents === 'function' ? event.getCoalescedEvents() : [event];
    for (const sample of events) {
      const point = pointFromEvent(sample, rect);
      const last = activeStroke.points[activeStroke.points.length - 1];
      if (!last || Math.hypot(point.x - last.x, point.y - last.y) >= 0.65) activeStroke.points.push(point);
    }
    scheduleRedraw(false);
  } else if (shapeStart && previewShape) { previewShape.to = p; scheduleRedraw(false); }
});
function finishPointer(): void {
  if (lassoDrawing) { lassoDrawing = false; if (lassoPoints.length < 3) lassoPoints = []; else { const selection={id:crypto.randomUUID(),name:'Lazo '+String(lassoSelections.length+1).padStart(2,'0'),points:lassoPoints.map(point=>({...point}))};lassoSelections.push(selection);hiddenLassoIds.delete(selection.id);activeLassoId=selection.id;lassoPoints=selection.points.map(point=>({...point})); snapshot(); } redraw(); if (lassoPoints.length >= 3) showToast('Lazo creado. Puedes moverlo o copiarlo desde sus controles.'); }
  if (activeStroke) { const finished = activeStroke; activeStroke = null; commitItem(finished); }
  if (shapeStart && previewShape) { const finished = previewShape; shapeStart = null; previewShape = null; commitItem(finished); }
  if (dragStart && lassoDragOrigin && hasMoved) { syncActiveLasso(); snapshot(); }
  if (dragStart && selectedId && hasMoved) { snapshot(); redraw(); }
  dragStart = null; dragOrigin = null; lassoDragOrigin=null; hasMoved = false; resizing = false; resizeHandle = null;
}
canvas.addEventListener('pointerup', finishPointer);
canvas.addEventListener('pointercancel', finishPointer);

function hideLassoOverlay(): void { activePhotoSection=null; document.querySelectorAll<HTMLButtonElement>('[data-photo-jump]').forEach(button=>button.classList.remove('active')); lassoMoveMode=false; lassoSelections.forEach(selection=>hiddenLassoIds.add(selection.id)); if(activeLassoId)hiddenLassoIds.add(activeLassoId); activeLassoId=null; lassoPoints=[]; lassoDrawing=false; lassoDragOrigin=null; const move=document.querySelector<HTMLButtonElement>('#lasso-move');const topMove=document.querySelector<HTMLButtonElement>('#lasso-move-top');[move,topMove].forEach(b=>{if(b){b.setAttribute('aria-pressed','false');b.classList.remove('active');}});redraw(); }
document.querySelectorAll<HTMLElement>('[data-tool]').forEach(el => el.addEventListener('click', () => { const next=el.dataset.tool as Tool; if(next!=='lasso')hideLassoOverlay(); else { activePhotoSection=null; document.querySelectorAll<HTMLButtonElement>('[data-photo-jump]').forEach(button=>button.classList.remove('active')); } setTool(next); }));
document.addEventListener('pointerdown',event=>{const target=event.target;if(!(target instanceof Element)||target===canvas||canvas.contains(target))return;if(target.closest('#inspector,[data-photo-jump],.photo-adjustments,.hsl-color,.image-filter-control,.lasso-layer-panel,.lasso-actions'))return;hideLassoOverlay();selectedId=null;redraw();});
function toggleLassoMove(): void { if(!activeLassoId){showToast('Dibuja o selecciona un lazo primero');return;}lassoMoveMode=!lassoMoveMode;setTool('select');renderLassoLayers();showToast(lassoMoveMode?'Modo mover lazo activado: arrastra dentro del contorno':'Modo mover lazo desactivado'); }
document.querySelector('#lasso-move')!.addEventListener('click',toggleLassoMove);
document.querySelector('#lasso-move-top')!.addEventListener('click',toggleLassoMove);
function duplicateLasso(): void { if(lassoPoints.length<3||!activeLassoId){showToast('Dibuja o selecciona un lazo primero');return;}const offset=24;const points=lassoPoints.map(point=>({x:Math.max(0,Math.min(canvas.width,point.x+offset)),y:Math.max(0,Math.min(canvas.height,point.y+offset))}));const copy={id:crypto.randomUUID(),name:'Lazo copia '+String(lassoSelections.length+1).padStart(2,'0'),points};lassoSelections.push(copy);activeLassoId=copy.id;lassoPoints=points.map(point=>({...point}));lassoMoveMode=true;snapshot();setTool('select');redraw();showToast('Copia de la selección creada');}
document.querySelector('#lasso-duplicate')!.addEventListener('click',duplicateLasso);
document.querySelector('#lasso-copy-top')!.addEventListener('click',duplicateLasso);
function removeActiveLasso(): void { if(!activeLassoId){clearLassoSelections();return;}hiddenLassoIds.delete(activeLassoId);lassoSelections=lassoSelections.filter(selection=>selection.id!==activeLassoId);const next=lassoSelections[lassoSelections.length-1];if(next){activeLassoId=next.id;lassoPoints=next.points.map(point=>({...point}));}else{activeLassoId=null;lassoPoints=[];}lassoMoveMode=false;snapshot();redraw();showToast('Selección quitada');}
document.querySelector('#lasso-clear')!.addEventListener('click',removeActiveLasso);
document.querySelector('#lasso-hide-top')!.addEventListener('click',()=>clearLassoSelections('Contornos de lazo ocultos'));
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
document.querySelector('#layer-duplicate')!.addEventListener('click', duplicateSelected);
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
document.querySelectorAll<HTMLInputElement>('[data-hsl-color]').forEach(input => {
  input.addEventListener('input', () => { const item=items.find(candidate=>candidate.id===selectedId); if(!item||item.kind!=='image')return; photoPreviewScale=0.55; const color=input.dataset.hslColor as HslColor; const axis=input.dataset.hslAxis as 'h'|'s'|'l'; const current=item.hslMix?.[color]??{h:0,s:0,l:0}; item.hslMix={...(item.hslMix??{}),[color]:{...current,[axis]:Number(input.value)}}; const output=document.querySelector<HTMLOutputElement>('#hsl-'+color+'-'+axis); if(output)output.value=(Number(input.value)>0?'+':'')+input.value; const dot=document.querySelector<HTMLElement>('[data-hsl-preview="'+color+'"]');if(dot){const hue=(hslBaseHue[color]+(item.hslMix?.[color]?.h??0)*1.8+360)%360;const mix=item.hslMix?.[color]??{h:0,s:0,l:0};dot.style.backgroundColor='hsl('+hue+' '+Math.max(0,Math.min(100,50+mix.s*.5))+'% '+Math.max(5,Math.min(95,50+mix.l*.35))+'%)';} updateHslSliderTrack(input); scheduleRedraw(false); });
  input.addEventListener('change',()=>{photoPreviewScale=1;const item=items.find(candidate=>candidate.id===selectedId);if(item?.kind==='image')commitPhotoAdjustments(item,'Mezcla HSL aplicada; contorno oculto');});
});
document.querySelectorAll<HTMLInputElement>('[data-photo-adjust]').forEach(input => {
  input.addEventListener('input', () => {
    const item = items.find(candidate => candidate.id === selectedId);
    if (!item || item.kind !== 'image') return;
    const key = input.dataset.photoAdjust as 'exposure' | 'contrastAmount' | 'saturationAmount' | 'warmth' | 'highlights' | 'shadows' | 'whites' | 'blacks' | 'vibrance' | 'tint' | 'vignette' | 'grain';
    item[key] = Number(input.value);
    photoPreviewScale = 0.55;
    const output = input.closest('label')?.querySelector('output');
    if (output) output.textContent = `${Number(input.value) > 0 ? '+' : ''}${input.value}`;
    scheduleRedraw(false);
  });
  input.addEventListener('change', () => { photoPreviewScale = 1; const item = items.find(candidate => candidate.id === selectedId); if (item?.kind === 'image') commitPhotoAdjustments(item,'Ajuste aplicado; contorno oculto'); });
});
document.querySelector<HTMLSelectElement>('#image-filter')!.addEventListener('change', event => {
  const item = items.find(candidate => candidate.id === selectedId);
  if (!item || item.kind !== 'image') return;
  item.filter = (event.currentTarget as HTMLSelectElement).value as ImageFilter;
  commitPhotoAdjustments(item,'Filtro aplicado; contorno oculto');
});
canvas.addEventListener('dblclick', event => {
  const item = hitTest(pointFromEvent(event));
  if (!item || item.kind !== 'text') return;
  selectedId = item.id; editSelectedText();
});
document.querySelector('#redo')!.addEventListener('click', redo);
window.addEventListener('keydown', event => { if (event.key === 'Escape' && lassoPoints.length) clearLassoSelections(); });
document.querySelector('#clear')!.addEventListener('click', () => {
  const hasContent = items.length > 0 || lassoSelections.length > 0 || lassoPoints.length > 0 || !!activeStroke || !!previewShape;
  if (!hasContent) { showToast('El lienzo ya está vacío'); return; }
  if (!window.confirm('¿Quieres limpiar todo el lienzo, incluidas las selecciones de lazo? Esta acción se puede deshacer.')) return;
  items = [];
  selectedId = null;
  activeStroke = null;
  shapeStart = null;
  previewShape = null;
  dragStart = null;
  dragOrigin = null;
  resizing = false;
  lassoPoints = [];
  lassoSelections = [];
  activeLassoId = null;
  hiddenLassoIds.clear();
  lassoDrawing = false;
  lassoMoveMode = false;
  lassoDragOrigin = null;
  activePhotoSection = null;
  document.querySelectorAll<HTMLButtonElement>('[data-photo-jump]').forEach(button => button.classList.remove('active'));
  const move = document.querySelector<HTMLButtonElement>('#lasso-move');
  const topMove = document.querySelector<HTMLButtonElement>('#lasso-move-top');
  [move, topMove].forEach(button => {
    if (button) { button.setAttribute('aria-pressed', 'false'); button.classList.remove('active'); }
  });
  snapshot();
  redraw();
  updateHistoryButtons();
  showToast('Lienzo y selecciones limpiados');
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
  document.querySelector('#doc-title')!.textContent = value;
  document.title = `${value} — Lienzo`;
  document.querySelector('#save-status')!.textContent = 'Cambios sin guardar';
});

const PROJECT_STORAGE_KEY = 'lienzo-studio-project-v1';
function buildProjectPayload(): Record<string, unknown> {
  const savedItems = items.map(item => {
    if (item.kind !== 'image') return cloneItem(item);
    const { image, ...rest } = item;
    // A data URL is already portable; avoid allocating another canvas for it.
    const imageData = image.src.startsWith('data:image/')
      ? image.src
      : (() => {
          const imageCanvas = document.createElement('canvas');
          imageCanvas.width = image.naturalWidth || image.width;
          imageCanvas.height = image.naturalHeight || image.height;
          if (!imageCanvas.width || !imageCanvas.height) throw new Error('Imagen sin dimensiones válidas');
          const imageContext = imageCanvas.getContext('2d');
          if (!imageContext) throw new Error('No se pudo preparar una imagen');
          imageContext.drawImage(image, 0, 0);
          return imageCanvas.toDataURL('image/png');
        })();
    return { ...rest, imageData };
  });
  return {
    version: 1,
    name: document.querySelector<HTMLInputElement>('#project-name')!.value.trim() || 'Proyecto sin título',
    width: canvas.width,
    height: canvas.height,
    items: savedItems,
    lassoSelections: lassoSelections.map(selection => ({ id: selection.id, name: selection.name, points: selection.points.map(point => ({ ...point })) })),
    activeLassoId,
    hiddenLassoIds: Array.from(hiddenLassoIds)
  };
}
function saveProject(): boolean {
  try {
    localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(buildProjectPayload()));
    document.querySelector('#save-status')!.textContent = 'Guardado en este dispositivo';
    showToast('Proyecto editable guardado');
    return true;
  } catch (error) {
    console.error('No se pudo guardar el proyecto:', error);
    const isQuotaError = error instanceof DOMException &&
      (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED');
    showToast(isQuotaError
      ? 'No hay espacio suficiente para guardar. Prueba con imágenes más pequeñas.'
      : 'No se pudo guardar el proyecto. Comprueba las imágenes e inténtalo de nuevo.');
    return false;
  }
}
document.querySelector<HTMLButtonElement>('#download-project-btn')!.addEventListener('click', () => {
  try {
    const payload = buildProjectPayload();
    const serialized = JSON.stringify(payload);
    const name = String(payload.name || 'lienzo').replace(/[^a-z0-9-_]/gi, '-').toLowerCase();
    const blob = new Blob([serialized], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name + '.lienzo';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('Copia editable descargada');
  } catch (error) {
    console.error('No se pudo descargar el proyecto:', error);
    showToast('No se pudo crear el archivo del proyecto.');
  }
});
document.querySelector<HTMLButtonElement>('#open-project-file-btn')!.addEventListener('click', () => {
  document.querySelector<HTMLInputElement>('#project-file-input')!.click();
});
document.querySelector<HTMLInputElement>('#project-file-input')!.addEventListener('change', event => {
  const input = event.currentTarget as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  if (file.size > 150 * 1024 * 1024) {
    showToast('El archivo supera el límite de 150 MB.');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result !== 'string') {
      showToast('No se pudo leer el archivo del proyecto.');
      return;
    }
    void restoreProject(true, reader.result);
  };
  reader.onerror = () => showToast('No se pudo leer el archivo del proyecto.');
  reader.readAsText(file);
});

document.querySelector('#save-project-btn')!.addEventListener('click', saveProject);

function createNewProject(): void {
  if (items.length && !window.confirm('¿Crear un proyecto nuevo? Los cambios no guardados se perderán. El último guardado seguirá disponible.')) return;
  photoCommitVersion++;
  projectRestoreVersion++;
  items = [];
  selectedId = null;
  activeStroke = null;
  shapeStart = null;
  previewShape = null;
  dragStart = null;
  dragOrigin = null;
  resizing = false;
  lassoPoints = [];
  lassoSelections = [];
  activeLassoId = null;
  hiddenLassoIds.clear();
  lassoDrawing = false;
  lassoMoveMode = false;
  lassoDragOrigin = null;
  const move = document.querySelector<HTMLButtonElement>('#lasso-move');
  const topMove = document.querySelector<HTMLButtonElement>('#lasso-move-top');
  [move, topMove].forEach(button => {
    if (button) { button.setAttribute('aria-pressed', 'false'); button.classList.remove('active'); }
  });
  history = [[]];
  lassoHistory = [captureLassoHistory()];
  historyIndex = 0;
  const name = 'Proyecto sin título';
  document.querySelector<HTMLInputElement>('#project-name')!.value = name;
  document.querySelector('#doc-title')!.textContent = name;
  document.title = `${name} — Lienzo`;
  document.querySelector('#save-status')!.textContent = 'Documento nuevo';
  redraw();
  updateHistoryButtons();
  showToast('Nuevo proyecto creado; el guardado anterior se conserva');
}
document.querySelector('#new-project-btn')!.addEventListener('click', createNewProject);



function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isSavedPoint(value: unknown): value is Point {
  if (!value || typeof value !== 'object') return false;
  const point = value as Record<string, unknown>;
  return isFiniteNumber(point.x) && isFiniteNumber(point.y);
}

function isSavedLayerMeta(value: Record<string, unknown>): boolean {
  return typeof value.id === 'string' && value.id.length > 0 &&
    typeof value.visible === 'boolean' &&
    isFiniteNumber(value.opacity) && value.opacity >= 0 && value.opacity <= 1 &&
    (value.name === undefined || typeof value.name === 'string');
}

function isValidSavedItem(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  if (!isSavedLayerMeta(item)) return false;
  if (item.kind === 'stroke') {
    return Array.isArray(item.points) && item.points.length > 0 && item.points.every(isSavedPoint) &&
      typeof item.color === 'string' && isFiniteNumber(item.width) && item.width > 0 && typeof item.erase === 'boolean';
  }
  if (item.kind === 'shape') {
    return (item.shape === 'line' || item.shape === 'rect' || item.shape === 'ellipse') &&
      isSavedPoint(item.from) && isSavedPoint(item.to) && typeof item.color === 'string' &&
      isFiniteNumber(item.width) && item.width > 0 && typeof item.fill === 'boolean';
  }
  if (item.kind === 'text') {
    return isSavedPoint(item.at) && typeof item.text === 'string' && typeof item.color === 'string' &&
      isFiniteNumber(item.size) && item.size > 0;
  }
  if (item.kind === 'image') {
    return typeof item.imageData === 'string' && /^data:image\/(?:png|jpeg|webp);base64,/i.test(item.imageData) &&
      isFiniteNumber(item.x) && isFiniteNumber(item.y) && isFiniteNumber(item.width) && item.width > 0 &&
      isFiniteNumber(item.height) && item.height > 0 &&
      ['none', 'grayscale', 'sepia', 'contrast', 'saturate', 'blur'].includes(String(item.filter));
  }
  return false;
}

async function restoreProject(showMessages = true, sourceText?: string): Promise<void> {
  const restoreVersion = ++projectRestoreVersion;
  photoCommitVersion++;
  try {
    const raw = sourceText ?? localStorage.getItem(PROJECT_STORAGE_KEY);
    if (!raw) { if (showMessages) showToast('Todavía no hay un proyecto guardado'); return; }
    const project = JSON.parse(raw) as {
      version: number; name: string; width: number; height: number; items: unknown[];
      lassoSelections?: {id:string;name:string;points:Point[]}[]; activeLassoId?: string | null; hiddenLassoIds?: string[];
    };
    if (project.version !== 1 || !Array.isArray(project.items) || typeof project.name !== 'string' ||
        !isFiniteNumber(project.width) || !isFiniteNumber(project.height)) {
      throw new Error('Formato no compatible');
    }
    if (project.width !== canvas.width || project.height !== canvas.height) {
      throw new Error('El tamaño del lienzo no coincide');
    }
    if (!project.items.every(isValidSavedItem)) throw new Error('El proyecto contiene elementos no válidos');

    // Build the complete document before replacing the current one, so a broken
    // image or malformed layer can never leave the canvas half-restored.
    const restored = await Promise.all(project.items.map(async saved => {
      if (saved.kind === 'image') {
        const image = new Image();
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = () => reject(new Error('No se pudo recuperar una imagen'));
          image.src = saved.imageData as string;
        });
        const { imageData: _imageData, ...rest } = saved;
        return { ...rest, image } as unknown as Item;
      }
      return saved as unknown as Item;
    }));
    if (restoreVersion !== projectRestoreVersion) return;
    items = restored;
    lassoSelections = Array.isArray(project.lassoSelections) && project.lassoSelections.every(selection=>selection && typeof selection.id==='string' && typeof selection.name==='string' && Array.isArray(selection.points) && selection.points.length>=3 && selection.points.every(isSavedPoint)) ? project.lassoSelections.map(selection=>({id:selection.id,name:selection.name,points:selection.points.map(point=>({...point}))})) : [];
    activeLassoId = lassoSelections.some(selection=>selection.id===project.activeLassoId) ? project.activeLassoId! : (lassoSelections[lassoSelections.length-1]?.id ?? null);
    hiddenLassoIds = new Set(Array.isArray(project.hiddenLassoIds) ? project.hiddenLassoIds.filter(id=>typeof id==='string'&&lassoSelections.some(selection=>selection.id===id)) : []);
    lassoPoints = lassoSelections.find(selection=>selection.id===activeLassoId)?.points.map(point=>({...point})) ?? [];
    lassoMoveMode = false;
    lassoDrawing = false;
    lassoDragOrigin = null;
    selectedId = null;
    activeStroke = null;
    shapeStart = null;
    previewShape = null;
    dragStart = null;
    dragOrigin = null;
    resizing = false;
    // Restore must also clear the visual state of controls left by the prior document.
    const moveButton = document.querySelector<HTMLButtonElement>('#lasso-move');
    const topMoveButton = document.querySelector<HTMLButtonElement>('#lasso-move-top');
    [moveButton, topMoveButton].forEach(button => {
      if (button) {
        button.setAttribute('aria-pressed', 'false');
        button.classList.remove('active');
      }
    });
    history = [items.map(cloneItem)];
    lassoHistory = [captureLassoHistory()];
    historyIndex = 0;
    const name = project.name.trim() || 'Proyecto sin título';
    document.querySelector<HTMLInputElement>('#project-name')!.value = name;
    document.querySelector('#doc-title')!.textContent = name;
    document.title = `${name} — Lienzo`;
    document.querySelector('#save-status')!.textContent = 'Proyecto recuperado';
    redraw();
    updateHistoryButtons();
    if (showMessages) showToast('Proyecto editable recuperado');
  } catch (error) {
    console.error('No se pudo recuperar el proyecto:', error);
    if (showMessages) showToast('El guardado no es válido o no se pudo recuperar.');
  }
}
document.querySelector('#restore-project-btn')!.addEventListener('click', () => { void restoreProject(); });



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
document.querySelector('#close-inspector')!.addEventListener('click', () => { const panel=document.querySelector('#inspector')!; panel.classList.toggle('collapsed'); document.querySelector<HTMLButtonElement>('#inspector-toggle')?.setAttribute('aria-pressed', String(!panel.classList.contains('collapsed'))); });
document.querySelector('#inspector-toggle')!.addEventListener('click', () => { const panel=document.querySelector('#inspector')!; panel.classList.toggle('collapsed'); document.querySelector<HTMLButtonElement>('#inspector-toggle')!.setAttribute('aria-pressed', String(!panel.classList.contains('collapsed'))); });
document.querySelector('#mobile-more')!.addEventListener('click', () => { const panel=document.querySelector('#inspector')!; panel.classList.toggle('mobile-open'); document.querySelector<HTMLButtonElement>('#mobile-more')!.classList.toggle('active', panel.classList.contains('mobile-open')); });
document.addEventListener('keydown', event => {
  const target = event.target as HTMLElement;
  const typing = target.matches('input, textarea, select') || target.isContentEditable;
  const modifier = event.ctrlKey || event.metaKey;
  if (modifier && event.key.toLowerCase() === 'd') { event.preventDefault(); duplicateSelected(); return; }
  if (modifier && event.key.toLowerCase() === 's') {
    event.preventDefault();
    saveProject();
    return;
  }
  if (typing) return;
  if (modifier && event.key.toLowerCase() === 'z') { event.preventDefault(); event.shiftKey ? redo() : undo(); return; }
  if (modifier && event.key.toLowerCase() === 'y') { event.preventDefault(); redo(); return; }
  const keys: Record<string, Tool> = { v: 'select', b: 'pen', e: 'eraser', l: 'line', r: 'rect', o: 'ellipse', t: 'text' };
  const next = keys[event.key.toLowerCase()];
  if (next) { if (next !== 'lasso') hideLassoOverlay(); else { activePhotoSection = null; document.querySelectorAll<HTMLButtonElement>('[data-photo-jump]').forEach(button => button.classList.remove('active')); } setTool(next); return; }
  if ((event.key === 'Delete' || event.key === 'Backspace') && selectedId) { event.preventDefault(); deleteSelected(); return; }
  if (event.key === 'Escape') {
    activeStroke = null; shapeStart = null; previewShape = null; selectedId = null;
    dragStart = null; dragOrigin = null; resizing = false; redraw();
  }
});
redraw(); updateHistoryButtons(); setTool('select');
void restoreProject(false);
