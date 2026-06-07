const { MISIONES } = require('./data/maps');
const { MONSTRUOS } = require('./data/monsters');
const { HEROES } = require('./data/heroes');
const { HECHIZOS_HEROES, HECHIZOS_ZARGON } = require('./data/spells');
const { EQUIPO, ARTEFACTOS, CARTAS_TESORO } = require('./data/items');

// ─────────────────────────────────────────
// DADOS
// ─────────────────────────────────────────
// Dado rojo: 1-6
// Dado blanco de combate: cara1=calavera, cara2=calavera, cara3=escudo_negro, cara4=escudo_blanco, cara5=escudo_blanco, cara6=casco
// Dado negro de defensa: cara1=calavera, cara2=calavera, cara3=escudo_negro, cara4=escudo_negro, cara5=escudo_negro, cara6=escudo_negro

function tirarDadoRojo() {
  return Math.ceil(Math.random() * 6);
}

// Dado blanco: 2/6 calavera, 3/6 escudo (1=blanco, 2=negro), 1/6 casco (nada)
function tirarDadoBlanco() {
  const r = Math.ceil(Math.random() * 6);
  if (r <= 2) return 'calavera';
  if (r <= 5) return 'escudo_blanco';
  return 'casco';
}

// Dado negro: 2/6 calavera, 4/6 escudo negro
function tirarDadoNegro() {
  const r = Math.ceil(Math.random() * 6);
  if (r <= 2) return 'calavera';
  return 'escudo_negro';
}

function tirarDadosRojos(n) {
  let total = 0;
  const resultados = [];
  for (let i = 0; i < n; i++) {
    const r = tirarDadoRojo();
    resultados.push(r);
    total += r;
  }
  return { total, resultados };
}

function tirarDadosBlancos(n) {
  const resultados = [];
  let calaveras = 0;
  let escudos = 0;
  for (let i = 0; i < n; i++) {
    const r = tirarDadoBlanco();
    resultados.push(r);
    if (r === 'calavera') calaveras++;
    else if (r === 'escudo_blanco') escudos++;
  }
  return { calaveras, escudos, resultados };
}

function tirarDadosNegros(n) {
  const resultados = [];
  let calaveras = 0;
  let escudos = 0;
  for (let i = 0; i < n; i++) {
    const r = tirarDadoNegro();
    resultados.push(r);
    if (r === 'calavera') calaveras++;
    else if (r === 'escudo_negro') escudos++;
  }
  return { calaveras, escudos, resultados };
}

// ─────────────────────────────────────────
// ESTADO DE PARTIDA
// ─────────────────────────────────────────

function crearEstadoPartida(codigoSala, misionId = 1) {
  const misionDef = MISIONES.find(m => m.id === misionId);
  if (!misionDef) throw new Error(`Misión ${misionId} no encontrada`);

  // Clonar mapa profundamente para no mutar los datos base
  const mapa = JSON.parse(JSON.stringify(misionDef));

  // Inicializar habitaciones como no reveladas
  Object.values(mapa.rooms).forEach(r => { r.revealed = false; });

  // Marcar pasillo de inicio como revelado
  Object.values(mapa.rooms).forEach(r => {
    if (r.pasillo) r.revealed = true;
  });

  return {
    codigoSala,
    fase: 'lobby',       // lobby | mision | entre_misiones | fin
    misionActual: misionId,
    mapa,
    turno: {
      numero: 1,
      orden: [],         // ids de jugadores en orden de turno
      turnoActual: 0,    // índice en orden[]
      fase: 'heroe'      // heroe | zargon
    },
    jugadores: {},       // socketId -> { id, rol, heroe, stats... }
    monstruos: {},       // uid -> estado actual del monstruo
    mazoPrimario: barajarMazo([...CARTAS_TESORO]),
    mazoDescarte: [],
    log: []
  };
}

function barajarMazo(mazo) {
  for (let i = mazo.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [mazo[i], mazo[j]] = [mazo[j], mazo[i]];
  }
  return mazo;
}

function inicializarMonstruos(mapa) {
  const monstruos = {};
  (mapa.monsters || []).forEach(m => {
    const base = m.esBoss
      ? { ...m }
      : { ...MONSTRUOS[m.type], ...m };
    monstruos[m.uid] = {
      uid: m.uid,
      type: m.type,
      nombre: m.nombre || MONSTRUOS[m.type]?.nombre || m.type,
      x: m.x,
      y: m.y,
      roomId: m.roomId,
      pcActual: m.pcActual,
      pcMax: m.pcActual,
      movimiento: m.movimiento || MONSTRUOS[m.type]?.movimiento,
      ataque: m.ataque || MONSTRUOS[m.type]?.ataque,
      defensa: m.defensa || MONSTRUOS[m.type]?.defensa,
      mente: m.mente || MONSTRUOS[m.type]?.mente,
      tipo: MONSTRUOS[m.type]?.tipo || 'normal',
      esBoss: m.esBoss || false,
      esAliado: m.esAliado || false,
      vivo: true,
      revelado: false,
      efectos: {},      // dormido, paralizado, etc.
      hechizos: m.hechizos || [],
      inmune: m.inmune || [],
      especial: m.especial || null
    };
  });
  return monstruos;
}

function crearHeroePorTipo(tipo, genero) {
  const base = HEROES[tipo];
  if (!base) throw new Error(`Héroe desconocido: ${tipo}`);
  const esFemenino = genero === 'f';
  const hechizosInicio = obtenerHechizosInicio(tipo);

  return {
    tipo,
    nombre: esFemenino ? base.nombreF : base.nombre,
    genero,
    ataque: base.ataque,
    defensa: base.defensa,
    cuerpoMax: base.cuerpo,
    cuerpoActual: base.cuerpo,
    menteMax: base.mente,
    menteActual: base.mente,
    oro: 0,
    inventario: [{ ...EQUIPO[base.armaInicial] || { id: base.armaInicial, tipo: 'arma' } }],
    armaEquipada: base.armaInicial,
    armaduras: [],
    artefactos: [],
    hechizosDisponibles: hechizosInicio,
    hechizosUsados: [],
    efectos: {},
    salasExploradas: [],   // salas donde ya buscó tesoros (persiste toda la misión)
    habilidad: base.habilidad || null,
    vivo: true,
    x: null,
    y: null
  };
}

function obtenerHechizosInicio(tipo) {
  if (tipo === 'mago') {
    return [
      'tempestad_aire', 'rafaga', 'genio',
      'fuego_ira', 'valentia', 'bola_fuego',
      'agua_milagrosa', 'niebla', 'dormir'
    ];
  }
  if (tipo === 'elfo') {
    return ['piel_roca', 'cura_corporal', 'traves_roca'];
  }
  return [];
}

// ─────────────────────────────────────────
// MOVIMIENTO Y LÍNEA DE VISIÓN
// ─────────────────────────────────────────

function esCasillaTransitable(mapa, x, y, paraHeroe = true) {
  const grid = mapa.grid;
  if (y < 0 || y >= grid.length) return false;
  if (x < 0 || x >= grid[y].length) return false;
  const tipo = grid[y][x];
  // 0=muro, 3=puerta_h, 4=puerta_v, 7=mueble
  if (tipo === 0 || tipo === 7) return false;
  return true;
}

function esPuerta(mapa, x, y) {
  const grid = mapa.grid;
  if (y < 0 || y >= grid.length) return false;
  if (x < 0 || x >= grid[y].length) return false;
  return grid[y][x] === 3 || grid[y][x] === 4;
}

function obtenerPuertaEn(mapa, x, y) {
  return (mapa.doors || []).find(d => d.x === x && d.y === y);
}

// BFS para movimiento (sin diagonal, respeta puertas cerradas)
function calcularCasillasAlcanzables(mapa, startX, startY, movMax, ocupadas) {
  const alcanzables = new Set();
  const visitados = new Map();
  const cola = [{ x: startX, y: startY, pasos: 0 }];
  visitados.set(`${startX},${startY}`, 0);

  const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];

  while (cola.length > 0) {
    const { x, y, pasos } = cola.shift();
    if (pasos > 0) alcanzables.add(`${x},${y}`);

    if (pasos >= movMax) continue;

    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      const key = `${nx},${ny}`;

      if (visitados.has(key) && visitados.get(key) <= pasos + 1) continue;

      if (!esCasillaTransitable(mapa, nx, ny)) continue;

      // Verificar si hay puerta cerrada en el camino
      if (esPuerta(mapa, nx, ny)) {
        const puerta = obtenerPuertaEn(mapa, nx, ny);
        if (puerta && !puerta.open) continue; // Puerta cerrada = bloqueada
      }

      // No puede terminar en casilla ocupada por héroe/monstruo
      if (ocupadas.has(key)) {
        // Puede pasar por casillas de héroes pero no terminar
        visitados.set(key, pasos + 1);
        cola.push({ x: nx, y: ny, pasos: pasos + 1 });
        continue;
      }

      visitados.set(key, pasos + 1);
      alcanzables.add(key);
      cola.push({ x: nx, y: ny, pasos: pasos + 1 });
    }
  }

  return [...alcanzables].map(k => {
    const [x, y] = k.split(',').map(Number);
    return { x, y };
  });
}

// Línea de visión (Bresenham)
function tieneLineaVision(mapa, x1, y1, x2, y2) {
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1;
  const sy = y1 < y2 ? 1 : -1;
  let err = dx - dy;
  let cx = x1;
  let cy = y1;

  while (cx !== x2 || cy !== y2) {
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; cx += sx; }
    if (e2 < dx) { err += dx; cy += sy; }

    if (cx === x2 && cy === y2) break;

    const tipo = mapa.grid[cy]?.[cx];
    // Bloqueado por muro sólido o puerta cerrada
    if (tipo === 0 || tipo === 7) return false;
    if (tipo === 3 || tipo === 4) {
      const puerta = obtenerPuertaEn(mapa, cx, cy);
      if (puerta && !puerta.open) return false;
    }
  }
  return true;
}

// Habitación a la que pertenece una casilla
function obtenerSalaDesCasilla(mapa, x, y) {
  for (const [id, sala] of Object.entries(mapa.rooms)) {
    if (sala.cells.some(c => c.x === x && c.y === y)) return id;
  }
  return null;
}

// ─────────────────────────────────────────
// COMBATE
// ─────────────────────────────────────────

function calcularAtaqueHeroe(heroe, monstruo) {
  let numDados = heroe.ataque;

  // Arma equipada
  const arma = heroe.inventario.find(i => i.id === heroe.armaEquipada);
  if (arma) numDados = arma.dados || numDados;

  // Efecto Miedo
  if (heroe.efectos.miedo) numDados = 1;

  // Bonus Valentía
  if (heroe.efectos.valentia) numDados += 2;

  // Bonus Poción de Fuerza
  if (heroe.efectos.pocion_fuerza) numDados += 2;

  // Azote de Orcos
  if (arma?.id === 'azote_orcos' && monstruo.type === 'orco') {
    // Ataca dos veces — se maneja en el flujo de combate
  }

  const ataque = tirarDadosBlancos(numDados);
  let dano = ataque.calaveras;

  // Defensa del monstruo
  let numDefensa = monstruo.defensa;
  if (monstruo.efectos?.dormido) numDefensa = 0;
  if (monstruo.efectos?.sin_defensa) numDefensa = 0;

  const defensa = tirarDadosNegros(numDefensa);
  dano = Math.max(0, dano - defensa.escudos);

  return {
    dadosAtaque: numDados,
    resultadosAtaque: ataque.resultados,
    calaveras: ataque.calaveras,
    dadosDefensa: numDefensa,
    resultadosDefensa: defensa.resultados,
    escudos: defensa.escudos,
    danoFinal: dano
  };
}

function calcularAtaqueMonstruo(monstruo, heroe) {
  let numAtaque = monstruo.ataque;
  if (monstruo.especial?.ataqueDados) numAtaque = monstruo.especial.ataqueDados;

  const ataque = tirarDadosBlancos(numAtaque);
  let dano = ataque.calaveras;

  // Defensa del héroe
  let numDefensa = heroe.defensa;

  // Armaduras equipadas
  (heroe.armaduras || []).forEach(armId => {
    const arm = EQUIPO[armId] || ARTEFACTOS[armId];
    if (arm) numDefensa += (arm.bonusDefensa || 0);
  });

  // Artefactos de defensa
  (heroe.artefactos || []).forEach(artId => {
    const art = ARTEFACTOS[artId];
    if (art?.bonusDefensa) numDefensa += art.bonusDefensa;
  });

  // Efecto Piel de Roca
  if (heroe.efectos?.piel_roca) numDefensa += 1;

  // Poción de Defensa
  if (heroe.efectos?.pocion_defensa) numDefensa += 2;

  // En foso: -1 dado defensa (mínimo 1)
  if (heroe.efectos?.en_foso) numDefensa = Math.max(1, numDefensa - 1);

  const defensa = tirarDadosBlancos(numDefensa);
  dano = Math.max(0, dano - defensa.escudos);

  return {
    dadosAtaque: numAtaque,
    resultadosAtaque: ataque.resultados,
    calaveras: ataque.calaveras,
    dadosDefensa: numDefensa,
    resultadosDefensa: defensa.resultados,
    escudos: defensa.escudos,
    danoFinal: dano
  };
}

// ─────────────────────────────────────────
// FOG OF WAR - qué ve cada jugador
// ─────────────────────────────────────────

function construirVistaJugador(estado, socketId) {
  const jugador = estado.jugadores[socketId];
  if (!jugador) return null;

  if (jugador.rol === 'zargon') {
    // Zargon ve todo
    return {
      esZargon: true,
      mapa: estado.mapa,
      monstruos: estado.monstruos,
      jugadores: sanitizarJugadores(estado.jugadores),
      turno: estado.turno,
      log: estado.log.slice(-20)
    };
  }

  // Si el héroe aún no eligió clase, devolver vista mínima del lobby
  if (!jugador.heroe) {
    return {
      esZargon: false,
      mapa: null,
      monstruosVisibles: {},
      jugadores: sanitizarJugadores(estado.jugadores),
      miHeroe: null,
      turno: estado.turno,
      log: estado.log.slice(-20)
    };
  }

  // Héroe solo ve habitaciones reveladas y sus posiciones actuales
  const salasVisibles = new Set();
  const { x, y } = jugador.heroe;

  // Siempre ve la sala donde está
  const salaActual = obtenerSalaDesCasilla(estado.mapa, x, y);
  if (salaActual) salasVisibles.add(salaActual);

  // Ve todas las salas ya reveladas
  Object.entries(estado.mapa.rooms).forEach(([id, sala]) => {
    if (sala.revealed) salasVisibles.add(id);
  });

  // Filtrar monstruos visibles (solo en salas reveladas)
  const monstruosVisibles = {};
  Object.values(estado.monstruos).forEach(m => {
    if (m.vivo && salasVisibles.has(m.roomId)) {
      monstruosVisibles[m.uid] = m;
    }
  });

  // Filtrar celdas del mapa visibles
  const mapaFiltrado = filtrarMapaParaHeroe(estado.mapa, salasVisibles);

  return {
    esZargon: false,
    mapa: mapaFiltrado,
    monstruosVisibles,
    jugadores: sanitizarJugadores(estado.jugadores),
    miHeroe: jugador.heroe,
    turno: estado.turno,
    log: estado.log.slice(-20)
  };
}

function filtrarMapaParaHeroe(mapa, salasVisibles) {
  // Solo retornar cells de salas visibles
  const roomsFiltrados = {};
  Object.entries(mapa.rooms).forEach(([id, sala]) => {
    if (salasVisibles.has(id)) {
      roomsFiltrados[id] = sala;
    }
  });

  // Grid: solo mostrar celdas en salas visibles
  const celdasVisibles = new Set();
  Object.values(roomsFiltrados).forEach(sala => {
    sala.cells.forEach(c => celdasVisibles.add(`${c.x},${c.y}`));
  });

  const gridFiltrado = mapa.grid.map((row, y) =>
    row.map((tipo, x) => celdasVisibles.has(`${x},${y}`) ? tipo : 0)
  );

  // Puertas solo visibles si conectan con sala visible
  const puertasVisibles = (mapa.doors || []).filter(d => {
    return salasVisibles.has(d.roomA) || salasVisibles.has(d.roomB);
  });

  return {
    ...mapa,
    grid: gridFiltrado,
    rooms: roomsFiltrados,
    doors: puertasVisibles
  };
}

function sanitizarJugadores(jugadores) {
  const result = {};
  Object.entries(jugadores).forEach(([id, j]) => {
    result[id] = {
      id: j.id,
      nombre: j.nombre,
      rol: j.rol,
      listo: j.listo,
      heroe: j.heroe ? {
        tipo: j.heroe.tipo,
        nombre: j.heroe.nombre,
        cuerpoActual: j.heroe.cuerpoActual,
        cuerpoMax: j.heroe.cuerpoMax,
        menteActual: j.heroe.menteActual,
        x: j.heroe.x,
        y: j.heroe.y,
        vivo: j.heroe.vivo
      } : null
    };
  });
  return result;
}

// ─────────────────────────────────────────
// REVELAR HABITACIONES
// ─────────────────────────────────────────

function revelarSalaAlAbrirPuerta(estado, puertaId, socketId) {
  const puerta = estado.mapa.doors.find(d => d.id === puertaId);
  if (!puerta || puerta.open) return null;

  puerta.open = true;

  // Revelar la sala al otro lado
  const jugador = estado.jugadores[socketId];
  const salaActual = obtenerSalaDesCasilla(estado.mapa, jugador.heroe.x, jugador.heroe.y);
  const salaOtroLado = puerta.roomA === salaActual ? puerta.roomB : puerta.roomA;

  const sala = estado.mapa.rooms[salaOtroLado];
  if (sala && !sala.revealed) {
    sala.revealed = true;
    // Revelar monstruos en esta sala
    Object.values(estado.monstruos).forEach(m => {
      if (m.roomId === salaOtroLado) {
        m.revelado = true;
      }
    });
    return { salaRevelada: salaOtroLado, sala };
  }
  return { salaRevelada: null };
}

// ─────────────────────────────────────────
// TRAMPAS
// ─────────────────────────────────────────

function intentarDesactivarTrampa(heroe, tieneHerramientas) {
  const dado = tirarDadoNegro();
  if (heroe.tipo === 'enano') {
    // Enano: cualquier resultado excepto escudo negro = desactivada
    const exito = dado !== 'escudo_negro';
    return { exito, dado, dano: exito ? 0 : 1 };
  }
  // Con herramientas: escudo = éxito, calavera = falla -1 PC
  if (tieneHerramientas) {
    const exito = dado === 'escudo_negro';
    return { exito, dado, dano: exito ? 0 : 1 };
  }
  return { exito: false, dado: null, error: 'Sin herramientas ni habilidad' };
}

function intentarSaltarTrampa(movRestante) {
  if (movRestante < 2) return { exito: false, error: 'Necesitas al menos 2 casillas de movimiento' };
  const dado = tirarDadoNegro();
  const exito = dado !== 'calavera';
  return { exito, dado };
}

// ─────────────────────────────────────────
// MAZO DE TESOROS
// ─────────────────────────────────────────

function robarCartaTesoro(estado) {
  if (estado.mazoPrimario.length === 0) {
    // Rebarajar descartes que regresan al mazo
    const cartasQueRegresan = estado.mazoDescarte.filter(c => c.regresaAlMazo);
    estado.mazoPrimario = barajarMazo(cartasQueRegresan);
    estado.mazoDescarte = estado.mazoDescarte.filter(c => !c.regresaAlMazo);
  }
  if (estado.mazoPrimario.length === 0) return null;
  const carta = estado.mazoPrimario.shift();
  if (carta.regresaAlMazo) {
    estado.mazoDescarte.push(carta);
  }
  return carta;
}

// ─────────────────────────────────────────
// ORDEN DE TURNO
// ─────────────────────────────────────────

function avanzarTurno(estado) {
  const { turno } = estado;
  turno.turnoActual++;

  if (turno.turnoActual >= turno.orden.length) {
    turno.turnoActual = 0;
    turno.numero++;
    // Inicio de turno: limpiar algunos efectos temporales
    turno.orden.forEach(id => {
      const j = estado.jugadores[id];
      if (j?.heroe) {
        // Efecto Valentía se limpia si no hay monstruos visibles
        delete j.heroe.efectos.pocion_fuerza;
        delete j.heroe.efectos.pocion_defensa;
      }
    });
  }

  // Si el siguiente es Zargon
  const siguienteId = turno.orden[turno.turnoActual];
  const siguiente = estado.jugadores[siguienteId];
  turno.fase = siguiente?.rol === 'zargon' ? 'zargon' : 'heroe';

  // Limpiar efectos de saltar turno del jugador que acaba de terminar
  const jugadorActual = estado.jugadores[turno.orden[turno.turnoActual]];
  if (jugadorActual?.heroe?.efectos?.saltar_turno) {
    delete jugadorActual.heroe.efectos.saltar_turno;
  }

  // Verificar si el siguiente jugador tiene saltar_turno
  if (siguiente?.heroe?.efectos?.saltar_turno) {
    estado.log.push({ tipo: 'turno_saltado', mensaje: `${siguiente.nombre} pierde su turno.` });
    delete siguiente.heroe.efectos.saltar_turno;
    return avanzarTurno(estado);
  }

  // Verificar monstruos con turno saltado
  Object.values(estado.monstruos).forEach(m => {
    if (m.efectos?.saltar_turno_zargon) {
      delete m.efectos.saltar_turno_zargon;
    }
  });

  return turno.orden[turno.turnoActual];
}

function construirOrdenTurno(jugadores) {
  // Heroes primero (sentido horario), luego Zargon al final
  const heroes = Object.entries(jugadores)
    .filter(([, j]) => j.rol === 'heroe')
    .map(([id]) => id);
  const zargon = Object.entries(jugadores)
    .filter(([, j]) => j.rol === 'zargon')
    .map(([id]) => id);
  return [...heroes, ...zargon];
}

// ─────────────────────────────────────────
// VICTORIA / DERROTA
// ─────────────────────────────────────────

function verificarVictoria(estado) {
  const heroesVivos = Object.values(estado.jugadores)
    .filter(j => j.rol === 'heroe' && j.heroe?.vivo);
  if (heroesVivos.length === 0) return { resultado: 'derrota', razon: 'Todos los héroes han caído.' };

  const misionState = estado.misionState || {};
  if (misionState.objetivoCompletado) return { resultado: 'victoria' };

  // Si la misión tiene boss(es), victoria cuando todos están muertos
  const monstruos = Object.values(estado.monstruos);
  const bosses = monstruos.filter(m => m.esBoss);
  if (bosses.length > 0 && bosses.every(m => !m.vivo)) {
    return { resultado: 'victoria', razon: '¡Objetivo completado!' };
  }

  return null;
}

module.exports = {
  crearEstadoPartida,
  inicializarMonstruos,
  crearHeroePorTipo,
  calcularCasillasAlcanzables,
  tieneLineaVision,
  calcularAtaqueHeroe,
  calcularAtaqueMonstruo,
  revelarSalaAlAbrirPuerta,
  intentarDesactivarTrampa,
  intentarSaltarTrampa,
  robarCartaTesoro,
  avanzarTurno,
  construirOrdenTurno,
  construirVistaJugador,
  obtenerSalaDesCasilla,
  tirarDadosRojos,
  tirarDadosBlancos,
  tirarDadosNegros,
  tirarDadoRojo,
  verificarVictoria,
  barajarMazo
};
