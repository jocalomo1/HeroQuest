const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const engine = require('./gameEngine');
const { MISIONES } = require('./data/maps');
const { EQUIPO, ARTEFACTOS } = require('./data/items');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

// Salas activas: codigoSala -> estado de partida
const salas = new Map();

// ─────────────────────────────────────────
// GENERAR CÓDIGO DE SALA
// ─────────────────────────────────────────
function generarCodigo() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

// ─────────────────────────────────────────
// BROADCAST A TODOS EN UNA SALA
// ─────────────────────────────────────────
function emitirEstadoASala(codigoSala) {
  const estado = salas.get(codigoSala);
  if (!estado) return;

  Object.keys(estado.jugadores).forEach(socketId => {
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      const vista = engine.construirVistaJugador(estado, socketId);
      socket.emit('estado_actualizado', vista);
    }
  });
}

function emitirLog(codigoSala, mensaje, tipo = 'info') {
  io.to(codigoSala).emit('log_mensaje', { mensaje, tipo, ts: Date.now() });
}

// ─────────────────────────────────────────
// SOCKET EVENTS
// ─────────────────────────────────────────
io.on('connection', (socket) => {

  // ── CREAR SALA (Zargon) ──
  socket.on('crear_sala', ({ nombre }) => {
    const codigo = generarCodigo();
    const estado = engine.crearEstadoPartida(codigo, 1);
    estado.monstruos = engine.inicializarMonstruos(estado.mapa);

    const jugador = {
      id: socket.id,
      nombre: nombre || 'Zargon',
      rol: 'zargon',
      listo: false,
      heroe: null
    };
    estado.jugadores[socket.id] = jugador;

    salas.set(codigo, estado);
    socket.join(codigo);
    socket.codigoSala = codigo;

    socket.emit('sala_creada', { codigo, jugadorId: socket.id });
    emitirLog(codigo, `Zargon "${jugador.nombre}" ha creado la sala.`);
  });

  // ── UNIRSE A SALA (Héroe) ──
  socket.on('unirse_sala', ({ codigo, nombre }) => {
    const estado = salas.get(codigo);
    if (!estado) return socket.emit('error_sala', { mensaje: 'Sala no encontrada.' });
    if (estado.fase !== 'lobby') return socket.emit('error_sala', { mensaje: 'La partida ya ha comenzado.' });

    const numHeroes = Object.values(estado.jugadores).filter(j => j.rol === 'heroe').length;
    if (numHeroes >= 4) return socket.emit('error_sala', { mensaje: 'La sala está llena (máx. 4 héroes).' });

    const jugador = {
      id: socket.id,
      nombre: nombre || `Héroe ${numHeroes + 1}`,
      rol: 'heroe',
      listo: false,
      heroe: null
    };
    estado.jugadores[socket.id] = jugador;

    socket.join(codigo);
    socket.codigoSala = codigo;

    socket.emit('unido_sala', { codigo, jugadorId: socket.id, jugadores: estado.jugadores });
    io.to(codigo).emit('jugador_unido', { nombre: jugador.nombre, jugadores: engine.construirVistaJugador(estado, socket.id)?.jugadores });
    emitirLog(codigo, `"${jugador.nombre}" se ha unido como héroe.`);
  });

  // ── ELEGIR HÉROE ──
  socket.on('elegir_heroe', ({ tipo, genero }) => {
    const codigo = socket.codigoSala;
    console.log(`[elegir_heroe] socket=${socket.id} tipo=${tipo} genero=${genero} codigo=${codigo}`);

    if (!codigo) {
      console.log(`[elegir_heroe] ERROR: socket sin codigoSala`);
      return socket.emit('error_heroe', { mensaje: 'No estás en ninguna sala. Vuelve al inicio.' });
    }

    const estado = salas.get(codigo);
    if (!estado) {
      console.log(`[elegir_heroe] ERROR: sala ${codigo} no encontrada`);
      return socket.emit('error_heroe', { mensaje: 'Sala no encontrada.' });
    }

    const jugador = estado.jugadores[socket.id];
    if (!jugador) {
      console.log(`[elegir_heroe] ERROR: jugador ${socket.id} no encontrado en sala`);
      return socket.emit('error_heroe', { mensaje: 'No estás registrado en esta sala.' });
    }
    if (jugador.rol !== 'heroe') {
      return socket.emit('error_heroe', { mensaje: 'Solo los héroes pueden elegir clase.' });
    }

    // Verificar que el héroe no esté tomado
    const heroeTomado = Object.values(estado.jugadores).some(
      j => j.heroe?.tipo === tipo && j.id !== socket.id
    );
    if (heroeTomado) return socket.emit('error_heroe', { mensaje: 'Este héroe ya fue elegido por otro jugador.' });

    try {
      jugador.heroe = engine.crearHeroePorTipo(tipo, genero);
      jugador.listo = false;

      const mision = MISIONES.find(m => m.id === estado.misionActual);
      const posInicio = mision?.stairs?.entrada;
      if (posInicio) {
        jugador.heroe.x = posInicio.x;
        jugador.heroe.y = posInicio.y;
      }

      socket.emit('heroe_elegido', { heroe: jugador.heroe });
      io.to(codigo).emit('jugador_heroe_actualizado', { jugadorId: socket.id, heroe: { tipo, nombre: jugador.heroe.nombre } });
      emitirLog(codigo, `"${jugador.nombre}" ha elegido al ${jugador.heroe.nombre}.`);
    } catch (e) {
      socket.emit('error_heroe', { mensaje: e.message });
    }
  });

  // ── LISTO ──
  socket.on('jugador_listo', () => {
    const codigo = socket.codigoSala;
    const estado = salas.get(codigo);
    if (!estado) return;

    const jugador = estado.jugadores[socket.id];
    if (!jugador) return;
    if (jugador.rol === 'heroe' && !jugador.heroe) return socket.emit('error', { mensaje: 'Elige un héroe primero.' });

    jugador.listo = true;
    io.to(codigo).emit('jugador_listo_ok', { jugadorId: socket.id, nombre: jugador.nombre });

    // Verificar si todos están listos
    const todos = Object.values(estado.jugadores);
    const hayZargon = todos.some(j => j.rol === 'zargon');
    const todosListos = todos.length >= 2 && todos.every(j => j.listo);

    if (todosListos && hayZargon) {
      iniciarMision(codigo);
    }
  });

  // ── MOVER HÉROE ──
  socket.on('mover_heroe', ({ x, y }) => {
    const codigo = socket.codigoSala;
    const estado = salas.get(codigo);
    if (!estado) return;
    if (!esTurnoDeJugador(estado, socket.id)) return socket.emit('error', { mensaje: 'No es tu turno.' });

    const jugador = estado.jugadores[socket.id];
    if (!jugador?.heroe?.vivo) return;
    if (jugador.heroe.efectos?.ya_movio) return socket.emit('error', { mensaje: 'Ya te moviste este turno.' });

    const heroe = jugador.heroe;
    const tirada = engine.tirarDadosRojos(2);
    let movMax = tirada.total;

    // Coraza: solo 1 dado
    const coraza = (heroe.armaduras || []).includes('coraza') || (heroe.artefactos || []).includes('coraza');
    if (coraza) {
      const t = engine.tirarDadosRojos(1);
      movMax = t.total;
    }

    // Efecto Ráfaga
    if (heroe.efectos?.doble_movimiento) {
      movMax *= 2;
      delete heroe.efectos.doble_movimiento;
    }

    // Calcular casillas alcanzables
    const ocupadas = new Set();
    Object.values(estado.jugadores).forEach(j => {
      if (j.heroe?.vivo && j.id !== socket.id)
        ocupadas.add(`${j.heroe.x},${j.heroe.y}`);
    });
    Object.values(estado.monstruos).forEach(m => {
      if (m.vivo && m.revelado) ocupadas.add(`${m.x},${m.y}`);
    });

    const alcanzables = engine.calcularCasillasAlcanzables(
      estado.mapa, heroe.x, heroe.y, movMax, ocupadas
    );

    const puedeIr = alcanzables.some(c => c.x === x && c.y === y);
    if (!puedeIr) return socket.emit('error', { mensaje: 'No puedes mover a esa casilla.' });

    // Mover
    heroe.x = x;
    heroe.y = y;
    heroe.efectos.ya_movio = true;

    estado.log.push({ tipo: 'movimiento', mensaje: `${jugador.nombre} se mueve a (${x}, ${y}).` });

    // Verificar si abrió una puerta al entrar en pasillo adyacente
    // (se maneja con el evento abrir_puerta)

    // Revelar sala si llegó a una nueva habitación
    const salaId = engine.obtenerSalaDesCasilla(estado.mapa, x, y);
    if (salaId && !estado.mapa.rooms[salaId].revealed) {
      estado.mapa.rooms[salaId].revealed = true;
      Object.values(estado.monstruos).forEach(m => {
        if (m.roomId === salaId) m.revelado = true;
      });
      estado.log.push({ tipo: 'revelar', mensaje: `Se revela: ${estado.mapa.rooms[salaId].name}` });
    }

    emitirEstadoASala(codigo);
  });

  // ── SOLICITAR CASILLAS ALCANZABLES ──
  socket.on('solicitar_movimiento', () => {
    const codigo = socket.codigoSala;
    const estado = salas.get(codigo);
    if (!estado) return;
    if (!esTurnoDeJugador(estado, socket.id)) return;

    const jugador = estado.jugadores[socket.id];
    if (!jugador?.heroe?.vivo) return;
    if (jugador.heroe.efectos?.ya_movio) return socket.emit('casillas_alcanzables', { casillas: [] });

    const heroe = jugador.heroe;
    const tirada = engine.tirarDadosRojos(2);
    let movMax = tirada.total;

    const coraza = (heroe.armaduras || []).includes('coraza');
    if (coraza) movMax = engine.tirarDadosRojos(1).total;
    if (heroe.efectos?.doble_movimiento) movMax *= 2;

    const ocupadas = new Set();
    Object.values(estado.jugadores).forEach(j => {
      if (j.heroe?.vivo && j.id !== socket.id) ocupadas.add(`${j.heroe.x},${j.heroe.y}`);
    });
    Object.values(estado.monstruos).forEach(m => {
      if (m.vivo && m.revelado) ocupadas.add(`${m.x},${m.y}`);
    });

    const casillas = engine.calcularCasillasAlcanzables(estado.mapa, heroe.x, heroe.y, movMax, ocupadas);

    jugador._movimientoSolicitado = { movMax, tirada };
    socket.emit('casillas_alcanzables', { casillas, movMax, tirada: tirada.resultados });
  });

  // ── ABRIR PUERTA ──
  socket.on('abrir_puerta', ({ puertaId }) => {
    const codigo = socket.codigoSala;
    const estado = salas.get(codigo);
    if (!estado) return;
    if (!esTurnoDeJugador(estado, socket.id)) return socket.emit('error', { mensaje: 'No es tu turno.' });

    const resultado = engine.revelarSalaAlAbrirPuerta(estado, puertaId, socket.id);
    if (!resultado) return;

    const jugador = estado.jugadores[socket.id];
    emitirLog(codigo, `${jugador.nombre} abre una puerta.`);

    if (resultado.salaRevelada) {
      emitirLog(codigo, `¡Se revela: ${resultado.sala.name}!`, 'reveal');
    }

    emitirEstadoASala(codigo);
  });

  // ── ATACAR MONSTRUO ──
  socket.on('atacar_monstruo', ({ monstruoUid }) => {
    const codigo = socket.codigoSala;
    const estado = salas.get(codigo);
    if (!estado) return;
    if (!esTurnoDeJugador(estado, socket.id)) return socket.emit('error', { mensaje: 'No es tu turno.' });

    const jugador = estado.jugadores[socket.id];
    if (!jugador?.heroe?.vivo) return;
    if (jugador.heroe.efectos?.ya_ataco) return socket.emit('error', { mensaje: 'Ya atacaste este turno.' });

    const heroe = jugador.heroe;
    const monstruo = estado.monstruos[monstruoUid];
    if (!monstruo?.vivo) return socket.emit('error', { mensaje: 'El monstruo no existe o ya está muerto.' });

    // Verificar adyacencia (o distancia si tiene arma a distancia)
    const arma = heroe.inventario.find(i => i.id === heroe.armaEquipada);
    const esDistancia = arma?.especial === 'distancia_no_adyacente';
    const esDiagonal = arma?.especial === 'diagonal';

    if (!esDistancia) {
      const dx = Math.abs(heroe.x - monstruo.x);
      const dy = Math.abs(heroe.y - monstruo.y);
      const esAdyacente = (dx + dy === 1) || (esDiagonal && dx <= 1 && dy <= 1 && (dx + dy > 0));
      if (!esAdyacente) return socket.emit('error', { mensaje: 'No estás adyacente al monstruo.' });
    } else {
      // Ballesta: no adyacente, necesita línea de visión
      const dx = Math.abs(heroe.x - monstruo.x);
      const dy = Math.abs(heroe.y - monstruo.y);
      if (dx + dy === 1) return socket.emit('error', { mensaje: 'La ballesta no puede disparar en adyacente.' });
      if (!engine.tieneLineaVision(estado.mapa, heroe.x, heroe.y, monstruo.x, monstruo.y))
        return socket.emit('error', { mensaje: 'Sin línea de visión.' });
    }

    // Combate
    const resultado = engine.calcularAtaqueHeroe(heroe, monstruo);
    monstruo.pcActual -= resultado.danoFinal;

    heroe.efectos.ya_ataco = true;
    // Limpiar Valentía si usó el ataque
    delete heroe.efectos.valentia;
    delete heroe.efectos.pocion_fuerza;

    const muerto = monstruo.pcActual <= 0;
    if (muerto) {
      monstruo.vivo = false;
      monstruo.pcActual = 0;
    }

    estado.log.push({
      tipo: 'combate',
      mensaje: `${jugador.nombre} ataca a ${monstruo.nombre}: ${resultado.calaveras} golpes vs ${resultado.escudos} escudos = ${resultado.danoFinal} daño.${muerto ? ' ¡DERROTADO!' : ''}`
    });

    socket.emit('resultado_ataque', { resultado, monstruoUid, muerto });
    emitirEstadoASala(codigo);

    // Verificar victoria
    const fin = engine.verificarVictoria(estado);
    if (fin) terminarMision(codigo, fin);
  });

  // ── MONSTRUO ATACA HÉROE (Zargon) ──
  socket.on('monstruo_ataca', ({ monstruoUid, heroeSocketId }) => {
    const codigo = socket.codigoSala;
    const estado = salas.get(codigo);
    if (!estado) return;

    const zargon = estado.jugadores[socket.id];
    if (zargon?.rol !== 'zargon') return socket.emit('error', { mensaje: 'Solo Zargon puede hacer esto.' });
    if (!esTurnoDeZargon(estado)) return socket.emit('error', { mensaje: 'No es el turno de Zargon.' });

    const monstruo = estado.monstruos[monstruoUid];
    const heroeJugador = estado.jugadores[heroeSocketId];
    if (!monstruo?.vivo || !heroeJugador?.heroe?.vivo) return;

    const heroe = heroeJugador.heroe;

    // Verificar adyacencia
    const dx = Math.abs(heroe.x - monstruo.x);
    const dy = Math.abs(heroe.y - monstruo.y);
    if (dx + dy > 1) return socket.emit('error', { mensaje: 'El monstruo no está adyacente al héroe.' });

    const resultado = engine.calcularAtaqueMonstruo(monstruo, heroe);
    heroe.cuerpoActual -= resultado.danoFinal;

    // Limpiar Piel de Roca si recibió daño
    if (resultado.danoFinal > 0 && heroe.efectos?.piel_roca) {
      delete heroe.efectos.piel_roca;
    }

    const muerto = heroe.cuerpoActual <= 0;
    if (muerto) {
      heroe.cuerpoActual = 0;
      heroe.vivo = false;
      estado.log.push({ tipo: 'muerte', mensaje: `${heroeJugador.nombre} ha caído. ¡${heroe.nombre} ha muerto!` });
    }

    estado.log.push({
      tipo: 'combate',
      mensaje: `${monstruo.nombre} ataca a ${heroe.nombre}: ${resultado.calaveras} golpes vs ${resultado.escudos} escudos = ${resultado.danoFinal} daño.${muerto ? ' ¡MUERTO!' : ''}`
    });

    socket.emit('resultado_ataque_monstruo', { resultado, heroeSocketId, muerto });
    emitirEstadoASala(codigo);

    const fin = engine.verificarVictoria(estado);
    if (fin) terminarMision(codigo, fin);
  });

  // ── MOVER MONSTRUO (Zargon) ──
  socket.on('mover_monstruo', ({ monstruoUid, x, y }) => {
    const codigo = socket.codigoSala;
    const estado = salas.get(codigo);
    if (!estado) return;

    const zargon = estado.jugadores[socket.id];
    if (zargon?.rol !== 'zargon') return;
    if (!esTurnoDeZargon(estado)) return socket.emit('error', { mensaje: 'No es el turno de Zargon.' });

    const monstruo = estado.monstruos[monstruoUid];
    if (!monstruo?.vivo || !monstruo.revelado) return;
    if (monstruo.efectos?.dormido || monstruo.efectos?.paralizado) return socket.emit('error', { mensaje: 'El monstruo no puede moverse.' });
    if (monstruo.yaMovioEsteTurno) return socket.emit('error', { mensaje: `${monstruo.nombre} ya se movió este turno.` });

    // Validar movimiento (BFS simple)
    const ocupadas = new Set();
    Object.values(estado.jugadores).forEach(j => {
      if (j.heroe?.vivo) ocupadas.add(`${j.heroe.x},${j.heroe.y}`);
    });
    Object.values(estado.monstruos).forEach(m => {
      if (m.vivo && m.uid !== monstruoUid) ocupadas.add(`${m.x},${m.y}`);
    });

    const alcanzables = engine.calcularCasillasAlcanzables(
      estado.mapa, monstruo.x, monstruo.y, monstruo.movimiento, ocupadas
    );

    const puedeIr = alcanzables.some(c => c.x === x && c.y === y);
    if (!puedeIr) return socket.emit('error', { mensaje: 'Movimiento de monstruo inválido.' });

    monstruo.x = x;
    monstruo.y = y;
    monstruo.yaMovioEsteTurno = true;
    const nuevaSala = engine.obtenerSalaDesCasilla(estado.mapa, x, y);
    if (nuevaSala) monstruo.roomId = nuevaSala;

    estado.log.push({ tipo: 'movimiento_monstruo', mensaje: `${monstruo.nombre} se mueve.` });

    // Emitir solo a Zargon el movimiento completo; a héroes solo si está en sala revelada
    emitirEstadoASala(codigo);
  });

  // ── BUSCAR TESOROS ──
  socket.on('buscar_tesoros', () => {
    const codigo = socket.codigoSala;
    const estado = salas.get(codigo);
    if (!estado) return;
    if (!esTurnoDeJugador(estado, socket.id)) return socket.emit('error', { mensaje: 'No es tu turno.' });

    const jugador = estado.jugadores[socket.id];
    if (!jugador?.heroe?.vivo) return;
    const heroe = jugador.heroe;

    // Solo en habitaciones (no pasillos)
    const salaId = engine.obtenerSalaDesCasilla(estado.mapa, heroe.x, heroe.y);
    if (!salaId) return socket.emit('error', { mensaje: 'Debes estar en una habitación para buscar.' });
    const sala = estado.mapa.rooms[salaId];
    if (sala?.pasillo) return socket.emit('error', { mensaje: 'No se puede buscar en pasillos, solo en habitaciones.' });

    // Solo una vez por sala por héroe (persiste toda la misión)
    if (!heroe.salasExploradas) heroe.salasExploradas = [];
    if (heroe.salasExploradas.includes(salaId))
      return socket.emit('error', { mensaje: 'Ya buscaste tesoros en esta habitación.' });

    // Solo en habitaciones sin monstruos
    const monstruosEnSala = Object.values(estado.monstruos).filter(
      m => m.vivo && m.roomId === salaId
    );
    if (monstruosEnSala.length > 0) return socket.emit('error', { mensaje: 'Hay monstruos en la habitación.' });

    // Verificar tesoros especiales
    const tesoro = estado.mapa.specialPoints?.find(
      sp => sp.data?.usada === false && engine.obtenerSalaDesCasilla(estado.mapa, sp.x, sp.y) === salaId
    );

    // Marcar sala como explorada (persistente, no se borra al terminar turno)
    heroe.salasExploradas.push(salaId);

    if (tesoro) {
      tesoro.data.usada = true;
      estado.log.push({ tipo: 'tesoro', mensaje: `${jugador.nombre} encuentra: ${tesoro.data.descripcion}` });
      socket.emit('tesoro_especial', { tesoro: tesoro.data });

      // Dar oro
      if (tesoro.data.oro) heroe.oro = (heroe.oro || 0) + tesoro.data.oro;

      // Dar item especial
      if (tesoro.data.item) {
        const itemKey = tesoro.data.item;
        if (ARTEFACTOS[itemKey]) {
          heroe.artefactos.push(itemKey);
        } else if (tesoro.data.item === 'baston') {
          heroe.inventario.push({ id: 'baston', nombre: 'Bastón', tipo: 'arma', dados: 1 });
        } else if (tesoro.data.item === 'pocion_curativa_4pc') {
          heroe.inventario.push({ id: 'pocion_cur_esp', nombre: 'Poción Curativa', tipo: 'pocion', curar: 4 });
        }
      }
    } else {
      // Robar del mazo
      const carta = engine.robarCartaTesoro(estado);
      if (!carta) {
        estado.log.push({ tipo: 'tesoro', mensaje: `${jugador.nombre} busca pero no encuentra nada.` });
        socket.emit('carta_tesoro', { carta: null });
      } else {
        estado.log.push({ tipo: 'tesoro', mensaje: `${jugador.nombre} encuentra: ${carta.nombre}` });
        socket.emit('carta_tesoro', { carta });
        aplicarCartaTesoro(estado, socket.id, carta, codigo);
      }
    }

    emitirEstadoASala(codigo);
  });

  // ── BUSCAR TRAMPAS ──
  socket.on('buscar_trampas', () => {
    const codigo = socket.codigoSala;
    const estado = salas.get(codigo);
    if (!estado) return;
    if (!esTurnoDeJugador(estado, socket.id)) return socket.emit('error', { mensaje: 'No es tu turno.' });

    const jugador = estado.jugadores[socket.id];
    // Zargon debe revelar si hay trampa visible
    socket.emit('buscar_trampas_resultado', { mensaje: 'Has buscado trampas. Zargon indicará si encuentras algo.' });
    io.to(codigo).emit('log_mensaje', { mensaje: `${jugador.nombre} busca trampas.`, tipo: 'accion' });
    // Zargon puede responder con 'revelar_trampa'
  });

  // ── DESACTIVAR TRAMPA ──
  socket.on('desactivar_trampa', ({ trampaId }) => {
    const codigo = socket.codigoSala;
    const estado = salas.get(codigo);
    if (!estado) return;

    const jugador = estado.jugadores[socket.id];
    const heroe = jugador?.heroe;
    if (!heroe) return;

    const tieneHerramientas = heroe.inventario.some(i => i.id === 'herramientas') ||
                              heroe.artefactos?.includes('herramientas');

    const resultado = engine.intentarDesactivarTrampa(heroe, tieneHerramientas);

    if (!resultado.exito && resultado.dano > 0) {
      heroe.cuerpoActual -= resultado.dano;
      if (heroe.cuerpoActual <= 0) { heroe.cuerpoActual = 0; heroe.vivo = false; }
    }

    estado.log.push({
      tipo: 'trampa',
      mensaje: resultado.exito
        ? `${jugador.nombre} desactiva la trampa con éxito.`
        : `${jugador.nombre} falla al desactivar la trampa. -1 PC.`
    });

    socket.emit('resultado_trampa', resultado);
    emitirEstadoASala(codigo);
  });

  // ── LANZAR HECHIZO ──
  socket.on('lanzar_hechizo', ({ hechizoId, objetivoId, objetivoTipo }) => {
    const codigo = socket.codigoSala;
    const estado = salas.get(codigo);
    if (!estado) return;
    if (!esTurnoDeJugador(estado, socket.id)) return socket.emit('error', { mensaje: 'No es tu turno.' });

    const jugador = estado.jugadores[socket.id];
    const heroe = jugador?.heroe;
    if (!heroe?.vivo) return;

    if (!heroe.hechizosDisponibles.includes(hechizoId))
      return socket.emit('error', { mensaje: 'No tienes ese hechizo disponible.' });

    const resultado = aplicarHechizoPJ(estado, socket.id, hechizoId, objetivoId, objetivoTipo, codigo);
    if (resultado.error) return socket.emit('error', { mensaje: resultado.error });

    // Descartar hechizo (salvo Varita Mágica que permite 2/turno)
    const varMagica = heroe.artefactos?.includes('varita_magica');
    if (!varMagica || heroe.efectos?.ya_uso_hechizo) {
      heroe.hechizosDisponibles = heroe.hechizosDisponibles.filter(h => h !== hechizoId);
      heroe.hechizosUsados.push(hechizoId);
    }
    heroe.efectos.ya_uso_hechizo = true;
    heroe.efectos.ya_ataco = true;

    estado.log.push({ tipo: 'hechizo', mensaje: `${jugador.nombre} lanza ${hechizoId.replace(/_/g, ' ')}.` });
    socket.emit('hechizo_resultado', resultado);
    emitirEstadoASala(codigo);
  });

  // ── USAR ITEM ──
  socket.on('usar_item', ({ itemId }) => {
    const codigo = socket.codigoSala;
    const estado = salas.get(codigo);
    if (!estado) return;

    const jugador = estado.jugadores[socket.id];
    const heroe = jugador?.heroe;
    if (!heroe?.vivo) return;

    const idx = heroe.inventario.findIndex(i => i.id === itemId);
    if (idx === -1) return socket.emit('error', { mensaje: 'No tienes ese objeto.' });

    const item = heroe.inventario[idx];
    aplicarItem(heroe, item);

    if (item.descarte || item.tipo === 'pocion' || item.tipo === 'pocion_curativa' || item.tipo === 'especial') {
      heroe.inventario.splice(idx, 1);
    }

    estado.log.push({ tipo: 'item', mensaje: `${jugador.nombre} usa ${item.nombre}.` });
    socket.emit('item_usado', { item });
    emitirEstadoASala(codigo);
  });

  // ── EQUIPAR ARMA ──
  socket.on('equipar_arma', ({ itemId }) => {
    const codigo = socket.codigoSala;
    const estado = salas.get(codigo);
    if (!estado) return;

    const jugador = estado.jugadores[socket.id];
    const heroe = jugador?.heroe;
    if (!heroe) return;

    const item = heroe.inventario.find(i => i.id === itemId);
    if (!item || item.tipo !== 'arma') return socket.emit('error', { mensaje: 'Item no encontrado o no es arma.' });

    heroe.armaEquipada = itemId;
    socket.emit('arma_equipada', { itemId });
    emitirEstadoASala(codigo);
  });

  // ── TERMINAR TURNO ──
  socket.on('terminar_turno', () => {
    const codigo = socket.codigoSala;
    const estado = salas.get(codigo);
    if (!estado) return;
    if (!esTurnoDeJugador(estado, socket.id) && !esTurnoDeZargon(estado, socket.id)) return;

    const jugador = estado.jugadores[socket.id];
    // Limpiar efectos de un turno
    if (jugador?.heroe) {
      delete jugador.heroe.efectos.ya_movio;
      delete jugador.heroe.efectos.ya_ataco;
      delete jugador.heroe.efectos.ya_uso_hechizo;
      // ya_busco NO se borra — se usa salasExploradas que persiste toda la misión
    }

    // Si es Zargon, resetear flags de movimiento de monstruos
    if (jugador?.rol === 'zargon') {
      Object.values(estado.monstruos).forEach(m => {
        delete m.yaMovioEsteTurno;
        delete m.yaAtacoEsteTurno;
        if (m.efectos?.saltar_turno_zargon) delete m.efectos.saltar_turno_zargon;
      });
    }

    const siguienteId = engine.avanzarTurno(estado);
    const siguiente = estado.jugadores[siguienteId];

    estado.log.push({ tipo: 'turno', mensaje: `Turno de: ${siguiente?.nombre || 'siguiente jugador'}.` });
    emitirEstadoASala(codigo);
    io.to(codigo).emit('nuevo_turno', {
      jugadorId: siguienteId,
      nombre: siguiente?.nombre,
      rol: siguiente?.rol,
      numeroTurno: estado.turno.numero
    });
  });

  // ── ZARGON: LANZAR HECHIZO DE TERROR ──
  socket.on('zargon_hechizo', ({ hechizoId, objetivoId }) => {
    const codigo = socket.codigoSala;
    const estado = salas.get(codigo);
    if (!estado) return;

    const zargon = estado.jugadores[socket.id];
    if (zargon?.rol !== 'zargon') return;
    if (!esTurnoDeZargon(estado)) return socket.emit('error', { mensaje: 'No es el turno de Zargon.' });

    // Los hechizos de Zargon tienen cooldown (se pueden usar 1 vez hasta regenerar)
    if (!estado.hechizosZargon) {
      estado.hechizosZargon = Object.keys(require('./data/spells').HECHIZOS_ZARGON);
    }
    if (!estado.hechizosZargon.includes(hechizoId))
      return socket.emit('error', { mensaje: 'Hechizo no disponible.' });

    const resultado = aplicarHechizoZargon(estado, hechizoId, objetivoId, codigo);
    if (resultado.error) return socket.emit('error', { mensaje: resultado.error });

    // Descartar carta
    estado.hechizosZargon = estado.hechizosZargon.filter(h => h !== hechizoId);

    estado.log.push({ tipo: 'hechizo_zargon', mensaje: `Zargon lanza ${hechizoId.replace(/_/g, ' ')}.` });
    socket.emit('hechizo_zargon_resultado', resultado);
    emitirEstadoASala(codigo);
  });

  // ── COMPRAR EN ARMERÍA ──
  socket.on('comprar_equipo', ({ itemId }) => {
    const codigo = socket.codigoSala;
    const estado = salas.get(codigo);
    if (!estado || estado.fase !== 'entre_misiones') return socket.emit('error', { mensaje: 'Solo se puede comprar entre misiones.' });

    const jugador = estado.jugadores[socket.id];
    const heroe = jugador?.heroe;
    if (!heroe) return;

    const item = EQUIPO[itemId];
    if (!item) return socket.emit('error', { mensaje: 'Item no disponible.' });
    if (heroe.oro < item.precio) return socket.emit('error', { mensaje: 'Oro insuficiente.' });

    // Validar restricciones
    if (item.restriccion === 'no_mago' && heroe.tipo === 'mago')
      return socket.emit('error', { mensaje: 'El Mago no puede usar este equipo.' });
    if (item.restriccion === 'solo_mago' && heroe.tipo !== 'mago')
      return socket.emit('error', { mensaje: 'Solo el Mago puede usar esto.' });

    heroe.oro -= item.precio;
    if (item.tipo === 'arma') {
      heroe.inventario.push({ ...item });
    } else if (item.tipo === 'armadura') {
      heroe.armaduras.push(itemId);
    } else {
      heroe.inventario.push({ ...item });
    }

    socket.emit('compra_ok', { item, oroRestante: heroe.oro });
    emitirEstadoASala(codigo);
  });

  // ── RECONEXIÓN ──
  socket.on('reconectar_sala', ({ codigo, rol, socketIdPrevio }) => {
    const estado = salas.get(codigo);
    if (!estado) return socket.emit('reconectar_error');

    // Buscar jugador por socketIdPrevio (puede estar marcado como desconectado)
    let jugadorPrevio = estado.jugadores[socketIdPrevio];

    // Si no encontró por ID previo, buscar por rol (útil cuando el disconnect
    // ya borró la entrada — solo aplica en lobby, pero por si acaso)
    if (!jugadorPrevio && rol === 'zargon') {
      const entry = Object.entries(estado.jugadores).find(([, j]) => j.rol === 'zargon');
      if (entry) { jugadorPrevio = entry[1]; socketIdPrevio = entry[0]; }
    }

    if (jugadorPrevio) {
      // Reasignar al nuevo socket.id
      delete estado.jugadores[socketIdPrevio];
      estado.jugadores[socket.id] = { ...jugadorPrevio, id: socket.id, desconectado: false };

      // Actualizar orden de turno
      const idx = estado.turno.orden.indexOf(socketIdPrevio);
      if (idx !== -1) estado.turno.orden[idx] = socket.id;
    } else if (estado.jugadores[socket.id]) {
      // Ya está con el nuevo socket.id (reconexión rápida)
    } else {
      console.log(`[reconectar_sala] No se encontró jugador. codigo=${codigo} socketIdPrevio=${socketIdPrevio}`);
      return socket.emit('reconectar_error');
    }

    socket.join(codigo);
    socket.codigoSala = codigo;

    const vista = engine.construirVistaJugador(estado, socket.id);

    // Incluir info del turno actual para que el cliente se sincronice
    const turnoActualId = estado.turno.orden[estado.turno.turnoActual];
    const jugadorTurno = estado.jugadores[turnoActualId];
    const infoTurno = {
      jugadorId: turnoActualId,
      nombre: jugadorTurno?.nombre,
      rol: jugadorTurno?.rol,
      numeroTurno: estado.turno.numero
    };

    socket.emit('reconectar_ok', { jugadorId: socket.id, estado: vista, turno: infoTurno });
    emitirLog(codigo, `"${estado.jugadores[socket.id]?.nombre}" se ha reconectado.`);
  });

  // ── SOLICITAR CASILLAS DE MONSTRUO (Zargon) ──
  socket.on('solicitar_movimiento_monstruo', ({ monstruoUid }) => {
    const codigo = socket.codigoSala;
    const estado = salas.get(codigo);
    if (!estado) return;

    const zargon = estado.jugadores[socket.id];
    if (zargon?.rol !== 'zargon') return;

    const m = estado.monstruos[monstruoUid];
    if (!m?.vivo) return;

    const ocupadas = new Set();
    Object.values(estado.jugadores).forEach(j => {
      if (j.heroe?.vivo) ocupadas.add(`${j.heroe.x},${j.heroe.y}`);
    });
    Object.values(estado.monstruos).forEach(mon => {
      if (mon.vivo && mon.uid !== monstruoUid) ocupadas.add(`${mon.x},${mon.y}`);
    });

    const casillas = engine.calcularCasillasAlcanzables(
      estado.mapa, m.x, m.y, m.movimiento, ocupadas
    );
    socket.emit('casillas_monstruo', { monstruoUid, casillas });
  });

  // ── DESCONEXIÓN ──
  socket.on('disconnect', () => {
    const codigo = socket.codigoSala;
    if (!codigo) return;

    const estado = salas.get(codigo);
    if (!estado) return;

    const jugador = estado.jugadores[socket.id];
    if (jugador) {
      emitirLog(codigo, `"${jugador.nombre}" se ha desconectado.`, 'advertencia');

      // Si la partida está en curso, NO borrar — marcar como desconectado
      // para que pueda reconectarse desde game.html
      if (estado.fase === 'mision' || estado.fase === 'entre_misiones') {
        jugador.desconectado = true;
        // Guardar referencia por socketId previo para reconexión
        estado._socketsPrevios = estado._socketsPrevios || {};
        estado._socketsPrevios[socket.id] = socket.id;
      } else {
        // En lobby sí se puede borrar
        delete estado.jugadores[socket.id];
      }
    }

    // Limpiar sala solo si no quedan jugadores en lobby
    const jugadoresActivos = Object.keys(estado.jugadores).length;
    if (jugadoresActivos === 0 && estado.fase === 'lobby') {
      salas.delete(codigo);
    } else if (jugadoresActivos > 0) {
      emitirEstadoASala(codigo);
    }
  });
});

// ─────────────────────────────────────────
// FUNCIONES AUXILIARES
// ─────────────────────────────────────────

function esTurnoDeJugador(estado, socketId) {
  const { turno } = estado;
  return turno.orden[turno.turnoActual] === socketId && turno.fase === 'heroe';
}

function esTurnoDeZargon(estado, socketId) {
  if (socketId) {
    const jugador = estado.jugadores[socketId];
    if (jugador?.rol !== 'zargon') return false;
  }
  return estado.turno.fase === 'zargon';
}

function iniciarMision(codigo) {
  const estado = salas.get(codigo);
  if (!estado) return;

  estado.fase = 'mision';
  estado.turno.orden = engine.construirOrdenTurno(estado.jugadores);
  estado.turno.turnoActual = 0;
  estado.turno.fase = 'heroe';
  estado.turno.numero = 1;

  const primero = estado.jugadores[estado.turno.orden[0]];
  estado.log.push({ tipo: 'inicio', mensaje: `¡Comienza la Misión ${estado.misionActual}! Turno de ${primero?.nombre}.` });

  io.to(codigo).emit('mision_iniciada', {
    misionId: estado.misionActual,
    nombre: MISIONES.find(m => m.id === estado.misionActual)?.nombre
  });

  emitirEstadoASala(codigo);
  io.to(codigo).emit('nuevo_turno', {
    jugadorId: estado.turno.orden[0],
    nombre: primero?.nombre,
    rol: primero?.rol,
    numeroTurno: 1
  });
}

function terminarMision(codigo, resultado) {
  const estado = salas.get(codigo);
  if (!estado) return;

  estado.fase = 'entre_misiones';
  io.to(codigo).emit('mision_terminada', resultado);
  emitirLog(codigo, resultado.resultado === 'victoria' ? '¡Misión completada!' : '¡Los héroes han sido derrotados!', resultado.resultado);

  if (resultado.resultado === 'victoria') {
    // Restaurar PC/PM y hechizos
    Object.values(estado.jugadores).forEach(j => {
      if (j.heroe) {
        j.heroe.cuerpoActual = j.heroe.cuerpoMax;
        j.heroe.menteActual = j.heroe.menteMax;
        j.heroe.hechizosDisponibles = engine.construirOrdenTurno ? obtenerHechizosInicio(j.heroe.tipo) : [];
        j.heroe.hechizosUsados = [];
        j.heroe.efectos = {};
      }
    });
  }

  emitirEstadoASala(codigo);
}

function obtenerHechizosInicio(tipo) {
  if (tipo === 'mago') return ['tempestad_aire','rafaga','genio','fuego_ira','valentia','bola_fuego','agua_milagrosa','niebla','dormir'];
  if (tipo === 'elfo') return ['piel_roca','cura_corporal','traves_roca'];
  return [];
}

function aplicarCartaTesoro(estado, socketId, carta, codigo) {
  const jugador = estado.jugadores[socketId];
  const heroe = jugador?.heroe;
  if (!heroe) return;

  if (carta.tipo === 'oro') {
    heroe.oro = (heroe.oro || 0) + carta.cantidad;
  } else if (carta.tipo === 'pocion_curativa') {
    const dados = engine.tirarDadosRojos(1);
    heroe.cuerpoActual = Math.min(heroe.cuerpoMax, heroe.cuerpoActual + dados.total);
    emitirLog(codigo, `${jugador.nombre} recupera ${dados.total} PC.`, 'curacion');
  } else if (carta.tipo === 'pocion_heroica') {
    heroe.inventario.push({ id: 'pocion_heroica_inv', nombre: 'Poción Heroica', tipo: 'pocion', efecto: 'atacar_dos_veces' });
  } else if (carta.tipo === 'pocion_defensa') {
    heroe.inventario.push({ id: 'pocion_defensa_inv', nombre: 'Poción de Defensa', tipo: 'pocion', efecto: 'bonus_defensa' });
  } else if (carta.tipo === 'pocion_fuerza') {
    heroe.inventario.push({ id: 'pocion_fuerza_inv', nombre: 'Poción de Fuerza', tipo: 'pocion', efecto: 'bonus_ataque' });
  } else if (carta.tipo === 'peligro') {
    heroe.cuerpoActual = Math.max(0, heroe.cuerpoActual - 1);
    if (heroe.cuerpoActual <= 0) heroe.vivo = false;
    emitirLog(codigo, `${jugador.nombre} cae en un peligro. -1 PC.`, 'peligro');
  } else if (carta.tipo === 'monstruo_errante') {
    emitirLog(codigo, `¡Monstruo Errante! Zargon coloca el monstruo errante adyacente a ${jugador.nombre}.`, 'peligro');
    io.to(codigo).emit('monstruo_errante', { heroeSocketId: socketId, heroeX: heroe.x, heroeY: heroe.y });
  }
}

function aplicarItem(heroe, item) {
  const efecto = item.efecto || item.tipo;
  if (efecto === 'pocion_curativa' || efecto === 'curar_4pc') {
    const dados = engine.tirarDadosRojos(1);
    heroe.cuerpoActual = Math.min(heroe.cuerpoMax, heroe.cuerpoActual + dados.total);
  } else if (efecto === 'curar_4pc_fijo') {
    heroe.cuerpoActual = Math.min(heroe.cuerpoMax, heroe.cuerpoActual + 4);
  } else if (efecto === 'doble_movimiento') {
    heroe.efectos.doble_movimiento = true;
  } else if (efecto === 'atacar_dos_veces') {
    heroe.efectos.atacar_dos_veces = true;
  } else if (efecto === 'bonus_defensa') {
    heroe.efectos.pocion_defensa = true;
  } else if (efecto === 'bonus_ataque') {
    heroe.efectos.pocion_fuerza = true;
  }
}

function aplicarHechizoPJ(estado, socketId, hechizoId, objetivoId, objetivoTipo, codigo) {
  const { HECHIZOS_HEROES } = require('./data/spells');
  const hechizo = HECHIZOS_HEROES[hechizoId];
  if (!hechizo) return { error: 'Hechizo desconocido' };

  const jugador = estado.jugadores[socketId];
  const heroe = jugador.heroe;

  switch (hechizo.efecto) {
    case 'saltar_turno': {
      const m = estado.monstruos[objetivoId];
      if (!m) return { error: 'Objetivo inválido' };
      m.efectos.saltar_turno_zargon = true;
      return { ok: true, mensaje: `${m.nombre} perderá su siguiente turno.` };
    }
    case 'doble_movimiento': {
      const objetivo = estado.jugadores[objetivoId] || jugador;
      objetivo.heroe.efectos.doble_movimiento = true;
      return { ok: true, mensaje: 'El movimiento del héroe se duplica.' };
    }
    case 'curar_4pc': {
      const objetivo = estado.jugadores[objetivoId] || jugador;
      const antes = objetivo.heroe.cuerpoActual;
      objetivo.heroe.cuerpoActual = Math.min(objetivo.heroe.cuerpoMax, objetivo.heroe.cuerpoActual + 4);
      return { ok: true, mensaje: `${objetivo.heroe.nombre} recupera ${objetivo.heroe.cuerpoActual - antes} PC.` };
    }
    case 'dano_1_evitable': {
      const m = estado.monstruos[objetivoId];
      if (!m) return { error: 'Objetivo inválido' };
      const dado = engine.tirarDadosRojos(1);
      if (dado.resultados[0] >= 5) {
        return { ok: true, mensaje: `${m.nombre} esquiva el hechizo.`, evitado: true };
      }
      m.pcActual -= 1;
      if (m.pcActual <= 0) { m.pcActual = 0; m.vivo = false; }
      return { ok: true, mensaje: `${m.nombre} recibe 1 daño de Fuego de la Ira.`, dano: 1 };
    }
    case 'dano_2_reducible': {
      const m = estado.monstruos[objetivoId];
      if (!m) return { error: 'Objetivo inválido' };
      const dados = engine.tirarDadosRojos(2);
      let dano = 2;
      dados.resultados.forEach(d => { if (d >= 5) dano--; });
      dano = Math.max(0, dano);
      m.pcActual -= dano;
      if (m.pcActual <= 0) { m.pcActual = 0; m.vivo = false; }
      return { ok: true, mensaje: `${m.nombre} recibe ${dano} daños de Bola de Fuego.`, dano };
    }
    case 'bonus_ataque_2dados': {
      const objetivo = estado.jugadores[objetivoId] || jugador;
      objetivo.heroe.efectos.valentia = true;
      return { ok: true, mensaje: 'El héroe ataca con 2 dados extra en su próximo ataque.' };
    }
    case 'atravesar_monstruos': {
      heroe.efectos.atravesar_monstruos = true;
      return { ok: true, mensaje: 'El héroe puede pasar por monstruos este movimiento.' };
    }
    case 'dormir': {
      const m = estado.monstruos[objetivoId];
      if (!m) return { error: 'Objetivo inválido' };
      if (m.tipo === 'muerto_viviente') return { error: 'Dormir no funciona en muertos vivientes.' };
      m.efectos.dormido = true;
      return { ok: true, mensaje: `${m.nombre} se queda dormido.` };
    }
    case 'bonus_defensa_1dado': {
      heroe.efectos.piel_roca = true;
      return { ok: true, mensaje: '+1 dado de defensa hasta recibir daño.' };
    }
    case 'atravesar_paredes': {
      heroe.efectos.atravesar_paredes = true;
      return { ok: true, mensaje: 'Puedes atravesar paredes en tu próximo movimiento.' };
    }
    case 'abrir_puerta_o_ataque_5dados': {
      if (objetivoTipo === 'puerta') {
        const puerta = estado.mapa.doors.find(d => d.id === objetivoId);
        if (puerta) {
          puerta.open = true;
          const salaRevelada = puerta.roomA === engine.obtenerSalaDesCasilla(estado.mapa, heroe.x, heroe.y) ? puerta.roomB : puerta.roomA;
          if (estado.mapa.rooms[salaRevelada]) {
            estado.mapa.rooms[salaRevelada].revealed = true;
            Object.values(estado.monstruos).forEach(m => { if (m.roomId === salaRevelada) m.revelado = true; });
          }
          return { ok: true, mensaje: 'La puerta se abre mágicamente.' };
        }
      } else {
        const m = estado.monstruos[objetivoId];
        if (!m) return { error: 'Objetivo inválido' };
        const ataque = engine.tirarDadosBlancos(5);
        let dano = ataque.calaveras;
        const def = engine.tirarDadosNegros(m.defensa);
        dano = Math.max(0, dano - def.escudos);
        m.pcActual -= dano;
        if (m.pcActual <= 0) { m.pcActual = 0; m.vivo = false; }
        return { ok: true, mensaje: `Genio: ${dano} daños a ${m.nombre}.`, dano };
      }
      return { error: 'Objetivo inválido' };
    }
    default:
      return { ok: true, mensaje: 'Hechizo aplicado.' };
  }
}

function aplicarHechizoZargon(estado, hechizoId, objetivoId, codigo) {
  const { HECHIZOS_ZARGON } = require('./data/spells');
  const hechizo = HECHIZOS_ZARGON[hechizoId];
  if (!hechizo) return { error: 'Hechizo desconocido' };

  const objetivo = estado.jugadores[objetivoId];
  const heroe = objetivo?.heroe;

  switch (hechizo.efecto) {
    case 'saltar_turno': {
      if (!heroe) return { error: 'Héroe no encontrado' };
      heroe.efectos.saltar_turno = true;
      return { ok: true, mensaje: `${heroe.nombre} perderá su siguiente turno.` };
    }
    case 'dormir_heroe': {
      if (!heroe) return { error: 'Héroe no encontrado' };
      heroe.efectos.dormido = true;
      return { ok: true, mensaje: `${heroe.nombre} cae dormido.` };
    }
    case 'reducir_ataque_1dado': {
      if (!heroe) return { error: 'Héroe no encontrado' };
      heroe.efectos.miedo = true;
      return { ok: true, mensaje: `${heroe.nombre} solo puede atacar con 1 dado.` };
    }
    case 'controlar_heroe': {
      if (!heroe) return { error: 'Héroe no encontrado' };
      heroe.efectos.dominado = true;
      return { ok: true, mensaje: `${heroe.nombre} está bajo el control de Zargon.` };
    }
    case 'dano_2_reducible': {
      if (!heroe) return { error: 'Héroe no encontrado' };
      const dados = engine.tirarDadosRojos(2);
      let dano = 2;
      dados.resultados.forEach(d => { if (d >= 5) dano--; });
      dano = Math.max(0, dano);
      heroe.cuerpoActual -= dano;
      if (heroe.cuerpoActual <= 0) { heroe.cuerpoActual = 0; heroe.vivo = false; }
      return { ok: true, mensaje: `Bola en Llamas: ${heroe.nombre} recibe ${dano} daños.`, dano };
    }
    case 'destruir_arma_yelmo': {
      if (!heroe) return { error: 'Héroe no encontrado' };
      const armasMetalicas = heroe.inventario.filter(i =>
        ['espada_corta','espada_ancha','espada_larga','espada_fortuna'].includes(i.id)
      );
      const yelmos = (heroe.armaduras || []).filter(a => a === 'yelmo');
      if (armasMetalicas.length === 0 && yelmos.length === 0) return { ok: true, mensaje: 'No hay armas/yelmos metálicos que destruir.' };
      // Destruir primero arma equipada si es metálica
      if (armasMetalicas.length > 0) {
        heroe.inventario = heroe.inventario.filter(i => i.id !== armasMetalicas[0].id);
        if (heroe.armaEquipada === armasMetalicas[0].id) heroe.armaEquipada = 'daga';
        return { ok: true, mensaje: `Oxidación destruye ${armasMetalicas[0].nombre} de ${heroe.nombre}.` };
      }
      heroe.armaduras = heroe.armaduras.filter(a => a !== 'yelmo');
      return { ok: true, mensaje: `Oxidación destruye el Yelmo de ${heroe.nombre}.` };
    }
    case 'invocar_muertos_vivientes': {
      const dado = engine.tirarDadosRojos(1);
      let nuevos = [];
      if (dado.resultados[0] <= 2) nuevos = Array(4).fill('esqueleto');
      else if (dado.resultados[0] <= 4) nuevos = ['esqueleto','esqueleto','esqueleto','zombi','zombi'];
      else nuevos = ['zombi','zombi','momia','momia'];
      return { ok: true, mensaje: `Se invocan: ${nuevos.join(', ')}. Zargon los coloca en el tablero.`, invocar: nuevos };
    }
    case 'invocar_orcos': {
      const dado = engine.tirarDadosRojos(1);
      const num = dado.resultados[0] <= 3 ? 4 : dado.resultados[0] <= 5 ? 5 : 6;
      return { ok: true, mensaje: `Se invocan ${num} Orcos. Zargon los coloca en el tablero.`, invocar: Array(num).fill('orco') };
    }
    case 'paralizar_zona': {
      // Paralizar todos los héroes en la misma habitación
      if (!objetivo) return { error: 'Objetivo inválido' };
      const salaId = engine.obtenerSalaDesCasilla(estado.mapa, heroe.x, heroe.y);
      let afectados = [];
      Object.values(estado.jugadores).forEach(j => {
        if (j.heroe?.vivo) {
          const s = engine.obtenerSalaDesCasilla(estado.mapa, j.heroe.x, j.heroe.y);
          if (s === salaId) {
            j.heroe.efectos.paralizado = true;
            afectados.push(j.heroe.nombre);
          }
        }
      });
      return { ok: true, mensaje: `Nube de Terror paraliza a: ${afectados.join(', ')}.` };
    }
    case 'rayo_2dano': {
      // Simplificado: daño a todos en línea (se amplía en frontend)
      return { ok: true, mensaje: 'Rayo Mortífero disparado. Zargon indica la dirección.', rayo: true };
    }
    case 'dano_3_zona': {
      if (!objetivo) return { error: 'Objetivo inválido' };
      const salaId = engine.obtenerSalaDesCasilla(estado.mapa, heroe.x, heroe.y);
      let resultados = [];
      Object.values(estado.jugadores).forEach(j => {
        if (j.heroe?.vivo) {
          const s = engine.obtenerSalaDesCasilla(estado.mapa, j.heroe.x, j.heroe.y);
          if (s === salaId) {
            const dados = engine.tirarDadosRojos(2);
            let dano = 3;
            dados.resultados.forEach(d => { if (d >= 5) dano--; });
            dano = Math.max(0, dano);
            j.heroe.cuerpoActual -= dano;
            if (j.heroe.cuerpoActual <= 0) { j.heroe.cuerpoActual = 0; j.heroe.vivo = false; }
            resultados.push({ nombre: j.heroe.nombre, dano });
          }
        }
      });
      return { ok: true, mensaje: `Tormenta de Fuego: ${resultados.map(r=>`${r.nombre} -${r.dano}PC`).join(', ')}` };
    }
    default:
      return { ok: true, mensaje: 'Hechizo aplicado.' };
  }
}

// ─────────────────────────────────────────
// API REST
// ─────────────────────────────────────────
app.get('/api/misiones', (req, res) => {
  res.json(MISIONES.map(m => ({ id: m.id, nombre: m.nombre, objetivo: m.objetivo })));
});

app.get('/api/equipo', (req, res) => {
  res.json(EQUIPO);
});

// ─────────────────────────────────────────
// INICIAR SERVIDOR
// ─────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`HeroQuest server corriendo en puerto ${PORT}`);
});
