// ─────────────────────────────────────────
// JUEGO PRINCIPAL (cliente)
// ─────────────────────────────────────────

const socket = io();

// Recuperar sesión
const miSocketIdLocal = sessionStorage.getItem('heroquest_id');
const miRol = sessionStorage.getItem('heroquest_rol');
const miCodigoSala = sessionStorage.getItem('heroquest_sala');

window.miSocketId = null;
window.turnoActualId = null;

let estadoActual = null;
let tablero = null;
let modoAccion = null; // 'mover' | 'atacar' | 'hechizo' | 'mover_monstruo' | 'atacar_monstruo'
let hechizoSeleccionado = null;
let monstruoSeleccionado = null;

// ─────────────────────────────────────────
// INICIALIZACIÓN
// ─────────────────────────────────────────
window.addEventListener('load', () => {
  if (!miCodigoSala) {
    window.location.href = '/';
    return;
  }

  tablero = new Tablero('tablero-canvas');
  document.getElementById('codigo-sala-juego').textContent = miCodigoSala;

  configurarEventosTablero();
  configurarBotones();

  // Reconectar al servidor
  socket.emit('reconectar_sala', {
    codigo: miCodigoSala,
    rol: miRol,
    socketIdPrevio: miSocketIdLocal
  });
});

window.addEventListener('resize', () => {
  if (tablero && estadoActual) tablero.actualizarEstado(estadoActual);
});

// ─────────────────────────────────────────
// EVENTOS DEL TABLERO
// ─────────────────────────────────────────
function configurarEventosTablero() {
  tablero.onCasillaClick = (x, y) => {
    if (modoAccion === 'mover') {
      socket.emit('mover_heroe', { x, y });
      // No llamar limpiarModo() aquí: el servidor responde con
      // 'casillas_alcanzables' (si hay movimiento restante) o
      // 'movimiento_agotado' (si se agotó) para decidir cuándo terminar
    } else if (modoAccion === 'mover_monstruo' && monstruoSeleccionado) {
      socket.emit('mover_monstruo', { monstruoUid: monstruoSeleccionado, x, y });
      limpiarModo();
    }
  };

  tablero.onMonstruoClick = (monstruo) => {
    if (modoAccion === 'atacar') {
      socket.emit('atacar_monstruo', { monstruoUid: monstruo.uid });
      limpiarModo();
    } else if (modoAccion === 'hechizo' && hechizoSeleccionado) {
      socket.emit('lanzar_hechizo', { hechizoId: hechizoSeleccionado, objetivoId: monstruo.uid, objetivoTipo: 'monstruo' });
      limpiarModo();
    } else if (modoAccion === 'atacar_monstruo' && monstruoSeleccionado) {
      // Zargon: monstruo seleccionado ataca a héroe (no aplica aquí)
    }
  };

  tablero.onHeroeClick = (heroeId, jugador) => {
    if (modoAccion === 'hechizo' && hechizoSeleccionado) {
      socket.emit('lanzar_hechizo', { hechizoId: hechizoSeleccionado, objetivoId: heroeId, objetivoTipo: 'heroe' });
      limpiarModo();
    } else if (modoAccion === 'atacar_monstruo' && monstruoSeleccionado) {
      // Zargon: monstruo ataca a héroe
      socket.emit('monstruo_ataca', { monstruoUid: monstruoSeleccionado, heroeSocketId: heroeId });
      limpiarModo();
    } else if (modoAccion === 'zargon_hechizo' && hechizoSeleccionado) {
      socket.emit('zargon_hechizo', { hechizoId: hechizoSeleccionado, objetivoId: heroeId });
      limpiarModo();
    }
  };

  tablero.onPuertaClick = (puerta) => {
    if (esMiTurno()) {
      socket.emit('abrir_puerta', { puertaId: puerta.id });
    }
  };
}

// ─────────────────────────────────────────
// BOTONES DE ACCIÓN
// ─────────────────────────────────────────
function configurarBotones() {
  document.getElementById('btn-mover').addEventListener('click', () => {
    if (!esMiTurno() || esZargon()) return;
    modoAccion = 'mover';
    socket.emit('solicitar_movimiento');
  });

  document.getElementById('btn-atacar').addEventListener('click', () => {
    if (!esMiTurno() || esZargon()) return;
    modoAccion = 'atacar';
    UI.agregarLog('Selecciona el monstruo a atacar.', 'info');
  });

  document.getElementById('btn-buscar-tesoros').addEventListener('click', () => {
    if (!esMiTurno() || esZargon()) return;
    socket.emit('buscar_tesoros');
  });

  document.getElementById('btn-buscar-trampas').addEventListener('click', () => {
    if (!esMiTurno() || esZargon()) return;
    socket.emit('buscar_trampas');
  });

  document.getElementById('btn-desactivar-trampa').addEventListener('click', () => {
    if (!esMiTurno() || esZargon()) return;
    socket.emit('desactivar_trampa', {});
  });

  document.getElementById('btn-terminar-turno').addEventListener('click', () => {
    socket.emit('terminar_turno');
    limpiarModo();
    UI.habilitarAcciones(false);
  });
}

// ─────────────────────────────────────────
// FUNCIONES EXPUESTAS A UI.js
// ─────────────────────────────────────────
window.juego = {
  usarItem(itemId) {
    if (!esMiTurno() && !esItemPocion(itemId)) return;
    socket.emit('usar_item', { itemId });
  },

  iniciarHechizo(hechizoId) {
    if (!esMiTurno() || esZargon()) return;
    hechizoSeleccionado = hechizoId;
    modoAccion = 'hechizo';
    UI.agregarLog(`Selecciona el objetivo para ${hechizoId.replace(/_/g, ' ')}.`, 'info');
  },

  iniciarMoverMonstruo(monstruoUid) {
    if (!esZargon() || !esTurnoZargon()) return;
    monstruoSeleccionado = monstruoUid;
    modoAccion = 'mover_monstruo';

    // Mostrar casillas alcanzables para el monstruo
    const estado = estadoActual;
    if (!estado) return;
    const m = estado.monstruos?.[monstruoUid];
    if (!m) return;

    const ocupadas = new Set();
    Object.values(estado.jugadores || {}).forEach(j => {
      if (j.heroe?.vivo) ocupadas.add(`${j.heroe.x},${j.heroe.y}`);
    });
    Object.values(estado.monstruos || {}).forEach(mon => {
      if (mon.vivo && mon.uid !== monstruoUid) ocupadas.add(`${mon.x},${mon.y}`);
    });

    socket.emit('solicitar_movimiento_monstruo', { monstruoUid });
    UI.agregarLog(`Selecciona casilla de destino para ${m.nombre}.`, 'info');
  },

  iniciarAtaqueMonstruo(monstruoUid) {
    if (!esZargon() || !esTurnoZargon()) return;
    monstruoSeleccionado = monstruoUid;
    modoAccion = 'atacar_monstruo';

    const m = estadoActual?.monstruos?.[monstruoUid];
    UI.agregarLog(`Selecciona el héroe que ${m?.nombre || 'el monstruo'} atacará.`, 'info');
  },

  lanzarHechizoZargon(hechizoId) {
    if (!esZargon() || !esTurnoZargon()) return;
    hechizoSeleccionado = hechizoId;
    modoAccion = 'zargon_hechizo';
    UI.agregarLog(`Selecciona el objetivo para ${hechizoId.replace(/_/g, ' ')}.`, 'hechizo_zargon');
  }
};

// ─────────────────────────────────────────
// SOCKET EVENTS
// ─────────────────────────────────────────

socket.on('connect', () => {
  window.miSocketId = socket.id;
});

socket.on('estado_actualizado', (estado) => {
  estadoActual = estado;
  window.miSocketId = window.miSocketId || socket.id;

  tablero.miSocketId = window.miSocketId;
  tablero.actualizarEstado(estado);

  // Actualizar UI según rol
  if (estado.esZargon) {
    UI.mostrarPanelZargon();
    UI.actualizarPanelZargon(estado.monstruos, estado.hechizosZargon);
  } else {
    UI.mostrarPanelHeroe();
    // miHeroe contiene el héroe completo del jugador local
    if (estado.miHeroe) {
      UI.actualizarStatsHeroe(estado.miHeroe);
      if (esMiTurno()) actualizarBotonesHeroe(estado.miHeroe);
    }
  }

  UI.actualizarPanelHeroes(estado.jugadores, window.turnoActualId);

  // Habilitar acciones según turno
  UI.habilitarAcciones(esMiTurno());
});

socket.on('log_mensaje', ({ mensaje, tipo }) => {
  UI.agregarLog(mensaje, tipo || 'info');
});

socket.on('nuevo_turno', ({ jugadorId, nombre, rol, numeroTurno }) => {
  window.turnoActualId = jugadorId;
  document.getElementById('info-turno').textContent = `Turno ${numeroTurno}: ${nombre}`;

  const esMio = jugadorId === window.miSocketId;
  if (esMio) {
    UI.mostrarBannerTurno('¡ES TU TURNO!');
    UI.habilitarAcciones(true);
  } else {
    UI.habilitarAcciones(false);
  }

  UI.actualizarPanelHeroes(estadoActual?.jugadores || {}, jugadorId);
  limpiarModo();
});

socket.on('casillas_alcanzables', ({ casillas, movMax, tirada, continuo }) => {
  tablero.setCasillasAlcanzables(casillas);
  if (esMiTurno() && !esZargon()) modoAccion = 'mover';

  // Deshabilitar botón mover y mostrar contador de pasos
  const btnMover = document.getElementById('btn-mover');
  if (btnMover) btnMover.disabled = true;
  UI.mostrarContadorMovimiento(movMax);

  if (!continuo && tirada?.length) {
    UI.mostrarDadosMovimiento(tirada, movMax);
    UI.agregarLog(`Movimiento: ${tirada.join('+')} = ${movMax} pasos`, 'info');
  } else if (continuo) {
    UI.agregarLog(`Movimiento restante: ${movMax} pasos`, 'info');
  }
});

socket.on('movimiento_agotado', () => {
  UI.ocultarContadorMovimiento();
  limpiarModo();
});

socket.on('resultado_ataque', ({ resultado, monstruoUid, muerto }) => {
  const msg = `Ataque: ${resultado.calaveras} 💀 vs ${resultado.escudos} escudos → ${resultado.danoFinal} daño${muerto ? '. ¡Derrotado!' : ''}`;
  UI.agregarLog(msg, 'combate');
  mostrarResultadoCombate(resultado, true);
});

socket.on('resultado_ataque_monstruo', ({ resultado, heroeSocketId, muerto }) => {
  const heroe = estadoActual?.jugadores?.[heroeSocketId]?.heroe;
  const msg = `Monstruo ataca a ${heroe?.nombre || '?'}: ${resultado.calaveras} 💀 vs ${resultado.escudos} escudos → ${resultado.danoFinal} daño${muerto ? '. ¡HÉROE CAÍDO!' : ''}`;
  UI.agregarLog(msg, muerto ? 'muerte' : 'combate');
  mostrarResultadoCombate(resultado, false);
});

socket.on('carta_tesoro', ({ carta }) => {
  if (carta) UI.mostrarCarta(carta);
  else UI.agregarLog('Buscas pero no encuentras nada.', 'info');
});

socket.on('tesoro_especial', ({ tesoro }) => {
  UI.mostrarCarta({ tipo: 'especial', nombre: 'Tesoro Especial', descripcion: tesoro.descripcion });
});

socket.on('hechizo_resultado', ({ resultado }) => {
  UI.agregarLog(resultado.mensaje || 'Hechizo lanzado.', 'hechizo');
});

socket.on('hechizo_zargon_resultado', ({ resultado }) => {
  UI.agregarLog(resultado.mensaje || 'Hechizo de Zargon.', 'hechizo_zargon');
});

socket.on('mision_terminada', (resultado) => {
  UI.mostrarFinMision(resultado).then(() => {
    if (resultado.resultado === 'victoria') {
      // Mostrar armería si hay siguiente misión
      fetch('/api/equipo').then(r => r.json()).then(equipo => {
        const miJugador = estadoActual?.jugadores?.[window.miSocketId];
        const heroe = miJugador?.heroe;
        if (heroe) {
          UI.mostrarArmeria(equipo, heroe.tipo, heroe.oro || 0, (itemId) => {
            socket.emit('comprar_equipo', { itemId });
          });
        }
      });
    }
  });
});

socket.on('compra_ok', ({ item, oroRestante }) => {
  UI.agregarLog(`Compraste: ${item.nombre}. Oro restante: ${oroRestante}`, 'info');
  document.getElementById('oro-armeria').textContent = oroRestante;
});

socket.on('monstruo_errante', ({ heroeX, heroeY }) => {
  if (esZargon()) {
    UI.agregarLog('¡Monstruo Errante! Coloca el monstruo errante adyacente al héroe.', 'peligro');
  }
});

socket.on('buscar_trampas_resultado', ({ mensaje }) => {
  UI.agregarLog(mensaje, 'info');
});

socket.on('resultado_trampa', ({ exito, dado, dano, error }) => {
  if (error) { UI.agregarLog(error, 'peligro'); return; }
  UI.agregarLog(exito ? 'Trampa desactivada con éxito.' : `Fallo al desactivar trampa. -${dano} PC.`, exito ? 'curacion' : 'peligro');
});

socket.on('error', ({ mensaje }) => {
  UI.agregarLog(`Error: ${mensaje}`, 'peligro');
});

socket.on('jugador_unido', ({ nombre }) => {
  UI.agregarLog(`${nombre} se ha unido.`, 'info');
});

// Reconexión de sesión
socket.on('reconectar_ok', ({ jugadorId, estado, turno }) => {
  window.miSocketId = jugadorId;
  if (estado) {
    estadoActual = estado;
    tablero.miSocketId = jugadorId;
    tablero.actualizarEstado(estado);

    // Inicializar UI igual que en estado_actualizado
    if (estado.esZargon) {
      UI.mostrarPanelZargon();
      UI.actualizarPanelZargon(estado.monstruos, estado.hechizosZargon);
    } else {
      UI.mostrarPanelHeroe();
      const miJugador = estado.jugadores?.[jugadorId];
      if (miJugador?.heroe) UI.actualizarStatsHeroe(miJugador.heroe);
    }

    // Sincronizar turno
    if (turno?.jugadorId) {
      window.turnoActualId = turno.jugadorId;
      document.getElementById('info-turno').textContent =
        `Turno ${turno.numeroTurno}: ${turno.nombre}`;
      UI.actualizarPanelHeroes(estado.jugadores, turno.jugadorId);
      UI.habilitarAcciones(turno.jugadorId === jugadorId);

      if (turno.jugadorId === jugadorId) {
        UI.mostrarBannerTurno('¡ES TU TURNO!');
      }
    }
  }
});

socket.on('reconectar_error', () => {
  UI.agregarLog('No se pudo reconectar. Volviendo al inicio...', 'peligro');
  setTimeout(() => window.location.href = '/', 2000);
});

// Movimiento de monstruo (Zargon recibe casillas)
socket.on('casillas_monstruo', ({ monstruoUid, casillas }) => {
  tablero.setCasillasAlcanzables(casillas);
});

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────
// Habilita/deshabilita botones según qué fases del turno ya usó el héroe.
// Regla: MOVIMIENTO+ACCION o ACCION+MOVIMIENTO, nunca intercalados.
function actualizarBotonesHeroe(heroe) {
  const ef = heroe.efectos || {};
  const yaMovio = !!ef.ya_movio;
  const yaActuo = !!ef.ya_ataco;

  const btnMover     = document.getElementById('btn-mover');
  const btnAtacar    = document.getElementById('btn-atacar');
  const btnTesoro    = document.getElementById('btn-buscar-tesoros');
  const btnTrampa    = document.getElementById('btn-buscar-trampas');
  const btnDesact    = document.getElementById('btn-desactivar-trampa');

  if (btnMover)  btnMover.disabled  = yaMovio;
  if (btnAtacar) btnAtacar.disabled  = yaActuo;
  if (btnTesoro) btnTesoro.disabled  = yaActuo;
  if (btnTrampa) btnTrampa.disabled  = yaActuo;

  // Mostrar "Desactivar Trampa" si hay trampa revelada visible (servidor valida la sala)
  if (btnDesact) {
    const mapa = estadoActual?.mapa;
    const hayTrampaRevelada = (mapa?.specialPoints || []).some(
      sp => sp.revelada && !sp.data?.usada && (sp.tipo === 'cofre_trampa' || sp.tipo === 'trampa')
    );
    if (hayTrampaRevelada && !yaActuo) {
      btnDesact.classList.remove('oculto');
      btnDesact.disabled = false;
    } else {
      btnDesact.classList.add('oculto');
    }
  }
}

function esMiTurno() {
  return window.turnoActualId === window.miSocketId;
}

function esZargon() {
  return miRol === 'zargon';
}

function esTurnoZargon() {
  const z = estadoActual?.jugadores?.[window.miSocketId];
  return z?.rol === 'zargon' && estadoActual?.turno?.fase === 'zargon';
}

function esItemPocion(itemId) {
  return itemId.includes('pocion') || itemId.includes('elixir');
}

function limpiarModo() {
  modoAccion = null;
  hechizoSeleccionado = null;
  monstruoSeleccionado = null;
  tablero.setCasillasAlcanzables([]);
  tablero.setCasillasAtacables([]);
  UI.ocultarContadorMovimiento();
  tablero.canvas.className = '';
}

function mostrarResultadoCombate(resultado, heroAtaca = true) {
  const atkColor = heroAtaca ? 'azul' : 'rojo';
  const defColor = heroAtaca ? 'rojo' : 'azul';
  const dano = resultado.danoFinal;
  const desc = dano > 0
    ? `${resultado.calaveras} \u{1F480} vs ${resultado.escudos} escudos = ${dano} daño`
    : resultado.calaveras === 0 ? 'Sin impacto' : 'Bloqueado';
  UI.mostrarDadosCombate(
    heroAtaca ? 'Ataque del Héroe' : 'Ataque del Monstruo',
    resultado.resultadosAtaque, atkColor,
    resultado.resultadosDefensa, defColor,
    desc
  );
}

// Reconexión al reconectar al servidor
socket.on('reconnect', () => {
  if (miCodigoSala) {
    socket.emit('reconectar_sala', {
      codigo: miCodigoSala,
      rol: miRol,
      socketIdPrevio: miSocketIdLocal
    });
  }
});
