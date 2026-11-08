/* ============================================================
   Neul Nexus — Lógica del catálogo
   ============================================================ */

/* Categorías fijas (con icono y color de acento) */
const CATEGORIAS = [
  { nombre: "Diseño",     icono: "🎨", color: "#ff9a00" },
  { nombre: "Ofimática",  icono: "📄", color: "#d83b01" },
  { nombre: "Multimedia", icono: "🎬", color: "#ea77ff" },
  { nombre: "Utilidades", icono: "🧰", color: "#4a9eff" },
  { nombre: "Desarrollo", icono: "💻", color: "#007acc" },
  { nombre: "Sistema",    icono: "⚙️", color: "#0078d4" },
  { nombre: "Seguridad",  icono: "🛡️", color: "#00a651" }
];

const STORAGE_KEY = "neul_nexus_clicks";
let PROGRAMAS = [];
let filtroActual = "Todos";
let busquedaActual = "";
let vistaActual = "inicio";

/* ---------- Utilidades ---------- */
function iniciales(nombre) {
  return nombre.split(" ").filter(Boolean).slice(0, 2).map(p => p[0]).join("").toUpperCase();
}

function oscurecer(hex, pct) {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, (n >> 16) - pct);
  const g = Math.max(0, ((n >> 8) & 0xff) - pct);
  const b = Math.max(0, (n & 0xff) - pct);
  return `rgb(${r},${g},${b})`;
}

/* ---------- LocalStorage (historial de clics) ---------- */
function getClicks() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
  catch { return {}; }
}
function registrarClic(id) {
  const c = getClicks();
  c[id] = (c[id] || 0) + 1;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
}
function topBuscados(limit = 6) {
  const c = getClicks();
  const ids = Object.keys(c);
  if (ids.length === 0) return PROGRAMAS.slice(0, limit);
  return ids
    .sort((a, b) => c[b] - c[a])
    .slice(0, limit)
    .map(id => PROGRAMAS.find(p => p.id === +id))
    .filter(Boolean);
}

/* ---------- Toast ---------- */
let toastTimer = null;
function mostrarToast(msg) {
  const toast = document.getElementById("toast");
  document.getElementById("toast-text").textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

/* ---------- Copiar al portapapeles ---------- */
async function copiarEnlace(p) {
  try {
    await navigator.clipboard.writeText(p.enlace);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = p.enlace;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch {}
    document.body.removeChild(ta);
  }
  registrarClic(p.id);
  mostrarToast(`Enlace de "${p.nombre}" copiado`);
  if (vistaActual === "inicio") renderMasBuscados();
}

/* ---------- Crear tarjeta ---------- */
function crearTarjeta(p) {
  const card = document.createElement("div");
  card.className = "card";
  card.style.setProperty("--card-color", p.color);
  card.setAttribute("role", "button");
  card.setAttribute("tabindex", "0");
  card.title = `Copiar enlace de ${p.nombre}`;

  const hint = document.createElement("span");
  hint.className = "card-copy-hint";
  hint.textContent = "📋";

  const logo = document.createElement("div");
  logo.className = "card-logo";
  if (p.logo) {
    const img = document.createElement("img");
    img.src = p.logo;
    img.alt = p.nombre;
    img.loading = "lazy";
    img.onerror = () => {
      logo.innerHTML = "";
      logo.textContent = iniciales(p.nombre);
      logo.style.background = `linear-gradient(135deg, ${p.color}, ${oscurecer(p.color, 40)})`;
    };
    logo.appendChild(img);
  } else {
    logo.textContent = iniciales(p.nombre);
    logo.style.background = `linear-gradient(135deg, ${p.color}, ${oscurecer(p.color, 40)})`;
  }

  const name = document.createElement("span");
  name.className = "card-name";
  name.textContent = p.nombre;

  card.appendChild(hint);
  card.appendChild(logo);
  card.appendChild(name);

  const accion = () => copiarEnlace(p);
  card.addEventListener("click", accion);
  card.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); accion(); }
  });

  return card;
}

/* ---------- Render: categorías ---------- */
function renderCategorias() {
  const grid = document.getElementById("categorias-grid");
  grid.innerHTML = "";
  CATEGORIAS.forEach(cat => {
    const total = PROGRAMAS.filter(p => p.categoria === cat.nombre).length;
    const el = document.createElement("div");
    el.className = "cat-card";
    el.style.setProperty("--cat-color", cat.color);
    el.innerHTML = `
      <div class="cat-icon">${cat.icono}</div>
      <div class="cat-name">${cat.nombre}</div>
      <div class="cat-count">${total} programa${total === 1 ? "" : "s"}</div>
    `;
    el.addEventListener("click", () => {
      filtroActual = cat.nombre;
      irVista("catalogo");
      renderFiltros();
      renderCatalogo();
    });
    grid.appendChild(el);
  });
}

/* ---------- Render: más buscados ---------- */
function renderMasBuscados() {
  const grid = document.getElementById("mas-buscados-grid");
  const hint = document.getElementById("mas-buscados-hint");
  grid.innerHTML = "";
  const top = topBuscados(6);
  const hayHistorial = Object.keys(getClicks()).length > 0;
  hint.textContent = hayHistorial ? "Según tu historial de clics" : "Sugeridos para empezar";
  top.forEach(p => grid.appendChild(crearTarjeta(p)));
}

/* ---------- Render: filtros ---------- */
function renderFiltros() {
  const cont = document.getElementById("filtros");
  cont.innerHTML = "";
  const todas = ["Todos", ...CATEGORIAS.map(c => c.nombre)];
  todas.forEach(nombre => {
    const b = document.createElement("button");
    b.className = "chip" + (filtroActual === nombre ? " active" : "");
    b.textContent = nombre;
    b.addEventListener("click", () => {
      filtroActual = nombre;
      renderFiltros();
      renderCatalogo();
    });
    cont.appendChild(b);
  });
}

/* ---------- Render: catálogo ---------- */
function renderCatalogo() {
  const grid = document.getElementById("catalogo-grid");
  const contador = document.getElementById("contador-programas");
  grid.innerHTML = "";

  const q = busquedaActual.trim().toLowerCase();
  const listado = PROGRAMAS.filter(p => {
    const okCat = filtroActual === "Todos" || p.categoria === filtroActual;
    const okBusq = !q || p.nombre.toLowerCase().includes(q);
    return okCat && okBusq;
  });

  contador.textContent = `${listado.length} de ${PROGRAMAS.length} programas`;

  if (listado.length === 0) {
    grid.innerHTML = `
      <div class="empty">
        <div class="empty-icon">🔍</div>
        <p>No se encontraron programas con ese filtro.</p>
      </div>`;
    return;
  }
  listado.forEach(p => grid.appendChild(crearTarjeta(p)));
}

/* ---------- Navegación entre vistas ---------- */
function irVista(v) {
  vistaActual = v;
  document.querySelectorAll(".view").forEach(s => s.classList.remove("active"));
  document.getElementById("view-" + v).classList.add("active");
  document.querySelectorAll("nav button").forEach(b =>
    b.classList.toggle("active", b.dataset.view === v)
  );
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ---------- Inicialización ---------- */
async function init() {
  document.getElementById("year").textContent = new Date().getFullYear();

  try {
    const res = await fetch("programas.json");
    if (!res.ok) throw new Error("No se pudo cargar programas.json");
    PROGRAMAS = await res.json();
  } catch (err) {
    console.error(err);
    document.getElementById("catalogo-grid").innerHTML = `
      <div class="empty">
        <div class="empty-icon">⚠️</div>
        <p>No se pudo cargar <code>programas.json</code>.</p>
        <p style="margin-top:8px;font-size:.85rem">Si abriste el HTML con doble clic, necesitas un servidor local. Ver instrucciones.</p>
      </div>`;
    return;
  }

  // Eventos
  document.querySelectorAll("nav button").forEach(b => {
    b.addEventListener("click", () => irVista(b.dataset.view));
  });
  document.getElementById("buscador").addEventListener("input", e => {
    busquedaActual = e.target.value;
    renderCatalogo();
  });

  // Primer render
  renderCategorias();
  renderMasBuscados();
  renderFiltros();
  renderCatalogo();
}

init();