// ─────────────────────────────────────────
// RENDERIZADO DEL TABLERO (Canvas)
// ─────────────────────────────────────────

const TILE_SIZE = 32;        // píxeles por casilla
const TILE_TIPOS = {
  0: 'vacio',
  1: 'habitacion',
  2: 'pasillo',
  3: 'puerta_h',
  4: 'puerta_v',
  5: 'escalera_entrada',
  6: 'escalera_salida',
  7: 'mueble'
};

// Colores del tablero
const COLORES = {
  vacio:             '#0d0a05',
  habitacion:        '#3a2a14',
  habitacion_borde:  '#5a3a1a',
  pasillo:           '#2a1e0e',
  pasillo_borde:     '#4a3218',
  puerta_abierta:    '#8b6030',
  puerta_cerrada:    '#5a3010',
  escalera:          '#2a6a3a',
  escalera_texto:    '#a0ffb0',
  mueble:            '#4a3218',
  alcanzable:        'rgba(212, 148, 58, 0.35)',
  alcanzable_borde:  'rgba(212, 148, 58, 0.8)',
  heroe:             '#4a8fd4',
  heroe_activo:      '#80c0ff',
  heroe_muerto:      '#444',
  monstruo:          '#c04040',
  monstruo_boss:     '#ff2020',
  aliado:            '#40c060',
  cursor_hover:      'rgba(255, 255, 255, 0.1)',
  seleccionado:      'rgba(212, 148, 58, 0.5)',
  fondo_oscuro:      'rgba(0,0,0,0.6)',
};

// Iconos para las fichas
const ICONOS = {
  barbaro: '🪓', barbaro_f: '🪓',
  enano: '🪖', enano_f: '🪖',
  elfo: '🏹', elfo_f: '🏹',
  mago: '🔮', mago_f: '🔮',
  goblin: '👺',
  orco: '👹',
  abominacion: '🐉',
  zombi: '🧟',
  esqueleto: '💀',
  momia: '🧟',
  guerrero_terror: '🧟‍♂️',
  gargola: '🦇',
  sir_ragnar: '🛡️',
  escalera: '🚪',
  cofre: '📦',
};

class Tablero {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.mapa = null;
    this.monstruos = {};
    this.jugadores = {};
    this.miSocketId = null;
    this.esZargon = false;

    this.casillasAlcanzables = [];
    this.casillasAtacables = [];
    this.casillaHover = null;
    this.offsetX = 0;
    this.offsetY = 0;
    this.zoom = 1;

    this.onCasillaClick = null;
    this.onMonstruoClick = null;
    this.onHeroeClick = null;
    this.onPuertaClick = null;

    this._bindEventos();
  }

  _bindEventos() {
    this.canvas.addEventListener('mousemove', (e) => this._onMouseMove(e));
    this.canvas.addEventListener('click', (e) => this._onClick(e));
    this.canvas.addEventListener('wheel', (e) => this._onWheel(e));

    // Drag para mover el tablero
    let dragging = false;
    let lastX, lastY;
    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 1 || e.button === 2) {
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        e.preventDefault();
      }
    });
    window.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      this.offsetX += e.clientX - lastX;
      this.offsetY += e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      this.renderizar();
    });
    window.addEventListener('mouseup', () => { dragging = false; });
    this.canvas.addEventListener('contextmenu', e => e.preventDefault());
  }

  _onWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    this.zoom = Math.min(3, Math.max(0.5, this.zoom + delta));
    this.renderizar();
  }

  _canvasACasilla(cx, cy) {
    const rect = this.canvas.getBoundingClientRect();
    const x = cx - rect.left;
    const y = cy - rect.top;
    const ts = TILE_SIZE * this.zoom;
    const col = Math.floor((x - this.offsetX) / ts);
    const row = Math.floor((y - this.offsetY) / ts);
    return { x: col, y: row };
  }

  _onMouseMove(e) {
    const { x, y } = this._canvasACasilla(e.clientX, e.clientY);
    if (this.casillaHover?.x !== x || this.casillaHover?.y !== y) {
      this.casillaHover = { x, y };
      this.renderizar();
    }

    // Tooltip de identificación al pasar sobre monstruo o héroe
    const rect = this.canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const monstruo = Object.values(this.monstruos).find(m => m.vivo && m.x === x && m.y === y);
    if (monstruo) {
      UI.mostrarTooltip(px, py,
        `<strong>${monstruo.nombre}</strong><br>` +
        `PC: ${monstruo.pcActual}/${monstruo.pcMax || monstruo.cuerpo || '?'} ` +
        `| ATQ: ${monstruo.ataque} | DEF: ${monstruo.defensa}`
      );
      return;
    }

    const heroeEntry = Object.entries(this.jugadores).find(([, j]) => j.heroe?.x === x && j.heroe?.y === y);
    if (heroeEntry) {
      const h = heroeEntry[1].heroe;
      UI.mostrarTooltip(px, py,
        `<strong>${h.nombre}</strong><br>` +
        `PC: ${h.cuerpoActual}/${h.cuerpoMax} | PM: ${h.menteActual}/${h.menteMax}`
      );
      return;
    }

    UI.ocultarTooltip();
  }

  _onClick(e) {
    if (e.button !== 0) return;
    const { x, y } = this._canvasACasilla(e.clientX, e.clientY);

    // Verificar si hay monstruo en esa casilla
    const monstruo = Object.values(this.monstruos).find(m => m.vivo && m.x === x && m.y === y);
    if (monstruo && this.onMonstruoClick) {
      this.onMonstruoClick(monstruo);
      return;
    }

    // Verificar si hay héroe
    const heroeEntry = Object.entries(this.jugadores).find(([, j]) => j.heroe?.x === x && j.heroe?.y === y);
    if (heroeEntry && this.onHeroeClick) {
      this.onHeroeClick(heroeEntry[0], heroeEntry[1]);
      return;
    }

    // Verificar puerta
    const puerta = (this.mapa?.doors || []).find(d => d.x === x && d.y === y && !d.open);
    if (puerta && this.onPuertaClick) {
      this.onPuertaClick(puerta);
      return;
    }

    // Casilla alcanzable
    if (this.casillasAlcanzables.length > 0) {
      const esAlcanzable = this.casillasAlcanzables.some(c => c.x === x && c.y === y);
      if (esAlcanzable && this.onCasillaClick) {
        this.onCasillaClick(x, y);
        return;
      }
    }

    if (this.onCasillaClick) this.onCasillaClick(x, y);
  }

  actualizarEstado(estado) {
    this.mapa = estado.mapa;
    this.monstruos = estado.monstruosVisibles || estado.monstruos || {};
    this.jugadores = estado.jugadores || {};
    this.esZargon = estado.esZargon || false;
    this._ajustarCanvas();
    this.renderizar();
  }

  _ajustarCanvas() {
    const contenedor = this.canvas.parentElement;
    this.canvas.width = contenedor.clientWidth;
    this.canvas.height = contenedor.clientHeight;

    if (this.mapa && this.offsetX === 0 && this.offsetY === 0) {
      // Centrar el mapa la primera vez
      const mapW = (this.mapa.grid[0]?.length || 20) * TILE_SIZE * this.zoom;
      const mapH = (this.mapa.grid?.length || 15) * TILE_SIZE * this.zoom;
      this.offsetX = (this.canvas.width - mapW) / 2;
      this.offsetY = (this.canvas.height - mapH) / 2;
    }
  }

  setCasillasAlcanzables(casillas) {
    this.casillasAlcanzables = casillas || [];
    this.renderizar();
    this.canvas.className = casillas?.length > 0 ? 'modo-mover' : '';
  }

  setCasillasAtacables(casillas) {
    this.casillasAtacables = casillas || [];
    this.renderizar();
    this.canvas.className = casillas?.length > 0 ? 'modo-atacar' : '';
  }

  renderizar() {
    if (!this.mapa) return;
    const ctx = this.ctx;
    const ts = TILE_SIZE * this.zoom;
    const grid = this.mapa.grid;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = COLORES.vacio;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Dibujar tiles
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        const tipo = grid[row][col];
        if (tipo === 0) continue;
        this._dibujarTile(col, row, tipo, ts);
      }
    }

    // Dibujar casillas alcanzables
    this.casillasAlcanzables.forEach(c => {
      const px = this.offsetX + c.x * ts;
      const py = this.offsetY + c.y * ts;
      ctx.fillStyle = COLORES.alcanzable;
      ctx.fillRect(px, py, ts, ts);
      ctx.strokeStyle = COLORES.alcanzable_borde;
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 0.5, py + 0.5, ts - 1, ts - 1);
    });

    // Dibujar casillas atacables
    this.casillasAtacables.forEach(c => {
      const px = this.offsetX + c.x * ts;
      const py = this.offsetY + c.y * ts;
      ctx.fillStyle = 'rgba(192, 64, 64, 0.35)';
      ctx.fillRect(px, py, ts, ts);
    });

    // Casilla hover
    if (this.casillaHover) {
      const { x, y } = this.casillaHover;
      if (grid[y]?.[x] && grid[y][x] !== 0) {
        const px = this.offsetX + x * ts;
        const py = this.offsetY + y * ts;
        ctx.fillStyle = COLORES.cursor_hover;
        ctx.fillRect(px, py, ts, ts);
      }
    }

    // Dibujar puertas
    (this.mapa.doors || []).forEach(d => this._dibujarPuerta(d, ts));

    // Dibujar puntos especiales
    (this.mapa.specialPoints || []).forEach(sp => this._dibujarPuntoEspecial(sp, ts));

    // Dibujar escalera
    if (this.mapa.stairs?.entrada) {
      this._dibujarEscalera(this.mapa.stairs.entrada.x, this.mapa.stairs.entrada.y, ts, '⬆️');
    }
    if (this.mapa.stairs?.salida) {
      this._dibujarEscalera(this.mapa.stairs.salida.x, this.mapa.stairs.salida.y, ts, '🏁');
    }

    // Dibujar monstruos
    Object.values(this.monstruos).forEach(m => {
      if (m.vivo) this._dibujarFicha(m.x, m.y, ts, ICONOS[m.type] || '👾',
        m.esBoss ? COLORES.monstruo_boss : m.esAliado ? COLORES.aliado : COLORES.monstruo,
        m.nombre, m.pcActual, m.pcMax || m.pcActual);
    });

    // Dibujar héroes
    Object.entries(this.jugadores).forEach(([id, j]) => {
      if (!j.heroe || !j.heroe.vivo) return;
      const { x, y, tipo, genero, cuerpoActual, cuerpoMax } = j.heroe;
      if (x == null || y == null) return;
      const esActivo = id === window.turnoActualId;
      const icono = ICONOS[tipo] || '🧙';
      this._dibujarFicha(x, y, ts, icono,
        esActivo ? COLORES.heroe_activo : COLORES.heroe,
        j.heroe.nombre, cuerpoActual, cuerpoMax,
        id === window.miSocketId
      );
    });

    // Si Zargon ve monstruos en todas las salas, revelar posiciones con fondo oscuro
    if (this.esZargon) {
      // Zargon siempre ve todo, no necesita fog
    }
  }

  _dibujarTile(col, row, tipo, ts) {
    const ctx = this.ctx;
    const px = this.offsetX + col * ts;
    const py = this.offsetY + row * ts;

    let colorFondo, colorBorde;

    switch (tipo) {
      case 1: // habitación
        colorFondo = COLORES.habitacion;
        colorBorde = COLORES.habitacion_borde;
        break;
      case 2: // pasillo
        colorFondo = COLORES.pasillo;
        colorBorde = COLORES.pasillo_borde;
        break;
      case 5: // escalera entrada
      case 6: // escalera salida
        colorFondo = '#1a3a2a';
        colorBorde = '#2a5a3a';
        break;
      case 7: // mueble
        colorFondo = COLORES.mueble;
        colorBorde = '#6a4a28';
        break;
      default:
        colorFondo = '#2a1e0e';
        colorBorde = '#4a3218';
    }

    ctx.fillStyle = colorFondo;
    ctx.fillRect(px, py, ts, ts);

    // Patrón de adoquines para habitaciones
    if (tipo === 1 && ts >= 16) {
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      if ((col + row) % 2 === 0) ctx.fillRect(px + ts * 0.1, py + ts * 0.1, ts * 0.4, ts * 0.4);
    }

    ctx.strokeStyle = colorBorde;
    ctx.lineWidth = 0.5;
    ctx.strokeRect(px + 0.5, py + 0.5, ts - 1, ts - 1);
  }

  _dibujarPuerta(puerta, ts) {
    const ctx = this.ctx;
    const px = this.offsetX + puerta.x * ts;
    const py = this.offsetY + puerta.y * ts;

    ctx.fillStyle = puerta.open ? COLORES.puerta_abierta : COLORES.puerta_cerrada;
    ctx.fillRect(px, py, ts, ts);

    // Dibujar símbolo de puerta
    ctx.fillStyle = puerta.open ? '#c8902a' : '#8a5010';
    const padding = ts * 0.15;
    if (puerta.orientation === 'h') {
      // Puerta horizontal: rectángulo ancho
      ctx.fillRect(px + padding, py + ts * 0.3, ts - padding * 2, ts * 0.4);
    } else {
      // Puerta vertical: rectángulo alto
      ctx.fillRect(px + ts * 0.3, py + padding, ts * 0.4, ts - padding * 2);
    }

    if (!puerta.open && ts >= 20) {
      ctx.fillStyle = '#ffcc66';
      ctx.font = `${ts * 0.5}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🚪', px + ts / 2, py + ts / 2);
    }
  }

  _dibujarPuntoEspecial(sp, ts) {
    if (sp.data?.usada) return;
    // Héroes solo ven puntos que Zargon reveló (búsqueda de trampas)
    if (!this.esZargon && !sp.revelada) return;
    const ctx = this.ctx;
    const px = this.offsetX + sp.x * ts;
    const py = this.offsetY + sp.y * ts;
    const icono = sp.tipo === 'tesoro_especial' ? '💰' :
                  sp.tipo === 'cofre_trampa' ? '⚠️' :
                  sp.tipo === 'cofre_vacio' ? '📦' :
                  sp.tipo === 'estante_armas' ? '⚔️' : '❓';

    ctx.font = `${ts * 0.6}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icono, px + ts / 2, py + ts / 2);
  }

  _dibujarEscalera(x, y, ts, icono) {
    const ctx = this.ctx;
    const px = this.offsetX + x * ts;
    const py = this.offsetY + y * ts;

    ctx.fillStyle = COLORES.escalera;
    ctx.fillRect(px, py, ts, ts);
    ctx.strokeStyle = '#4aaf6a';
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 1, py + 1, ts - 2, ts - 2);

    if (ts >= 24) {
      ctx.font = `${ts * 0.55}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(icono, px + ts / 2, py + ts / 2);
    }
  }

  _dibujarFicha(x, y, ts, icono, color, nombre, pcActual, pcMax, soyYo = false) {
    const ctx = this.ctx;
    const px = this.offsetX + x * ts;
    const py = this.offsetY + y * ts;
    const r = ts * 0.38;
    const cx = px + ts / 2;
    const cy = py + ts / 2;

    // Sombra
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 4;

    // Círculo de fondo
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    if (soyYo) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.shadowBlur = 0;

    // Icono
    if (ts >= 20) {
      ctx.font = `${ts * 0.45}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(icono, cx, cy);
    }

    // Nombre (solo si hay suficiente espacio)
    if (ts >= 28 && nombre) {
      ctx.font = `bold ${Math.max(8, ts * 0.2)}px sans-serif`;
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(nombre.substring(0, 8), cx, py + ts * 0.72);
    }

    // Barra de vida
    if (pcMax > 0) {
      const barW = ts * 0.8;
      const barH = Math.max(3, ts * 0.08);
      const barX = px + ts * 0.1;
      const barY = py + ts * 0.88;
      const pct = pcActual / pcMax;

      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(barX, barY, barW, barH);

      ctx.fillStyle = pct > 0.5 ? '#4caf74' : pct > 0.25 ? '#ffaa00' : '#ff4040';
      ctx.fillRect(barX, barY, barW * pct, barH);
    }
  }

  centrar() {
    if (!this.mapa) return;
    const mapW = (this.mapa.grid[0]?.length || 20) * TILE_SIZE * this.zoom;
    const mapH = (this.mapa.grid?.length || 15) * TILE_SIZE * this.zoom;
    this.offsetX = (this.canvas.width - mapW) / 2;
    this.offsetY = (this.canvas.height - mapH) / 2;
    this.renderizar();
  }
}

// Exportar para uso en game.js
window.Tablero = Tablero;
