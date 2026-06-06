const socket = io();

let miCodigo = null;
let miRol = null;
let miSocketId = null;
let heroeSeleccionado = null;
let generoSeleccionado = 'm';

// ── ELEMENTOS ──
const pantInicio = document.getElementById('pantalla-inicio');
const pantLobby = document.getElementById('pantalla-lobby');
const btnCrear = document.getElementById('btn-crear');
const btnUnirse = document.getElementById('btn-unirse');
const btnListoBtn = document.getElementById('btn-listo');
const btnConfirmarHeroe = document.getElementById('btn-confirmar-heroe');
const errorMsg = document.getElementById('mensaje-error');
const codigoDisplay = document.getElementById('codigo-sala-display');
const instrucciones = document.getElementById('instrucciones-lobby');
const listaJugadores = document.getElementById('lista-jugadores');
const seleccionHeroe = document.getElementById('seleccion-heroe');
const msgEsperando = document.getElementById('msg-esperando');

// ── CREAR SALA ──
btnCrear.addEventListener('click', () => {
  const nombre = document.getElementById('nombre-zargon').value.trim() || 'Zargon';
  socket.emit('crear_sala', { nombre });
});

// ── UNIRSE ──
btnUnirse.addEventListener('click', () => {
  const nombre = document.getElementById('nombre-heroe').value.trim() || 'Héroe';
  const codigo = document.getElementById('codigo-sala').value.trim().toUpperCase();
  if (!codigo) return mostrarError('Ingresa el código de sala.');
  socket.emit('unirse_sala', { codigo, nombre });
});

// Enter en inputs
document.getElementById('nombre-zargon').addEventListener('keydown', e => { if (e.key === 'Enter') btnCrear.click(); });
document.getElementById('codigo-sala').addEventListener('keydown', e => { if (e.key === 'Enter') btnUnirse.click(); });
document.getElementById('nombre-heroe').addEventListener('keydown', e => { if (e.key === 'Enter') btnUnirse.click(); });

// ── SELECCIÓN DE HÉROE ──
document.querySelectorAll('.heroe-opcion').forEach(card => {
  card.addEventListener('click', () => {
    if (card.classList.contains('tomado')) return;
    document.querySelectorAll('.heroe-opcion').forEach(c => c.classList.remove('seleccionado'));
    card.classList.add('seleccionado');
    heroeSeleccionado = card.dataset.tipo;
    btnConfirmarHeroe.disabled = false;
  });
});

// Botones de género — también seleccionan la carta
document.querySelectorAll('.btn-genero').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const card = btn.closest('.heroe-opcion');
    if (card.classList.contains('tomado')) return;

    // Seleccionar esta carta si no lo estaba
    document.querySelectorAll('.heroe-opcion').forEach(c => c.classList.remove('seleccionado'));
    card.classList.add('seleccionado');
    heroeSeleccionado = card.dataset.tipo;
    btnConfirmarHeroe.disabled = false;

    // Cambiar género
    card.querySelectorAll('.btn-genero').forEach(b => b.classList.remove('activo'));
    btn.classList.add('activo');
    generoSeleccionado = btn.dataset.genero;
  });
});

btnConfirmarHeroe.addEventListener('click', () => {
  if (!heroeSeleccionado) {
    mostrarError('Selecciona un héroe primero.');
    return;
  }
  const card = document.querySelector('.heroe-opcion.seleccionado');
  const genero = card?.querySelector('.btn-genero.activo')?.dataset.genero || 'm';
  btnConfirmarHeroe.disabled = true;
  btnConfirmarHeroe.textContent = 'Confirmando...';
  socket.emit('elegir_heroe', { tipo: heroeSeleccionado, genero });
});

// ── LISTO ──
btnListoBtn.addEventListener('click', () => {
  socket.emit('jugador_listo');
  btnListoBtn.disabled = true;
  btnListoBtn.textContent = '✅ ¡Listo!';
});

// ── SOCKET EVENTS ──
socket.on('sala_creada', ({ codigo, jugadorId }) => {
  miCodigo = codigo;
  miRol = 'zargon';
  miSocketId = jugadorId;
  sessionStorage.setItem('heroquest_sala', codigo);
  sessionStorage.setItem('heroquest_rol', 'zargon');
  sessionStorage.setItem('heroquest_id', jugadorId);
  mostrarLobby(codigo, 'zargon');
});

socket.on('unido_sala', ({ codigo, jugadorId }) => {
  miCodigo = codigo;
  miRol = 'heroe';
  miSocketId = jugadorId;
  sessionStorage.setItem('heroquest_sala', codigo);
  sessionStorage.setItem('heroquest_rol', 'heroe');
  sessionStorage.setItem('heroquest_id', jugadorId);
  mostrarLobby(codigo, 'heroe');
});

socket.on('error_sala', ({ mensaje }) => mostrarError(mensaje));
socket.on('error_heroe', ({ mensaje }) => mostrarError(mensaje));

socket.on('jugador_unido', ({ nombre, jugadores }) => {
  actualizarListaJugadores(jugadores);
});

socket.on('jugador_heroe_actualizado', ({ jugadorId, heroe }) => {
  const card = document.querySelector(`.jugador-lobby-card[data-id="${jugadorId}"]`);
  if (card) {
    const rolSpan = card.querySelector('.rol');
    if (rolSpan) rolSpan.textContent = `Héroe: ${heroe.nombre}`;
  }
  // Marcar como tomado
  document.querySelectorAll('.heroe-opcion').forEach(c => {
    if (c.dataset.tipo === heroe.tipo && jugadorId !== miSocketId) {
      c.classList.add('tomado');
      if (c.classList.contains('seleccionado')) {
        c.classList.remove('seleccionado');
        heroeSeleccionado = null;
        btnConfirmarHeroe.disabled = true;
      }
    }
  });
});

socket.on('jugador_listo_ok', ({ jugadorId, nombre }) => {
  const card = document.querySelector(`.jugador-lobby-card[data-id="${jugadorId}"]`);
  if (card) {
    card.classList.add('listo');
    let estadoDiv = card.querySelector('.estado-listo');
    if (!estadoDiv) {
      estadoDiv = document.createElement('div');
      estadoDiv.className = 'estado-listo';
      card.appendChild(estadoDiv);
    }
    estadoDiv.textContent = '✅ Listo';
  }
  if (jugadorId === miSocketId) {
    msgEsperando.textContent = 'Esperando que todos estén listos...';
  }
});

socket.on('heroe_elegido', ({ heroe }) => {
  btnListoBtn.disabled = false;
  seleccionHeroe.classList.add('oculto');
  btnConfirmarHeroe.textContent = '✅ Confirmado';
  instrucciones.textContent = `Has elegido al ${heroe.nombre}. ¡Pulsa "¡Estoy Listo!" cuando quieras empezar.`;
});

socket.on('error_heroe', ({ mensaje }) => {
  mostrarError(mensaje);
  btnConfirmarHeroe.disabled = false;
  btnConfirmarHeroe.textContent = 'Confirmar Héroe';
});

socket.on('mision_iniciada', ({ misionId, nombre }) => {
  // Redirigir al juego
  sessionStorage.setItem('heroquest_mision', misionId);
  window.location.href = '/game.html';
});

socket.on('estado_actualizado', (estado) => {
  if (estado.jugadores) actualizarListaJugadores(estado.jugadores);
});

// ── HELPERS ──
function mostrarLobby(codigo, rol) {
  pantInicio.classList.add('oculto');
  pantLobby.classList.remove('oculto');
  codigoDisplay.textContent = codigo;

  if (rol === 'zargon') {
    instrucciones.innerHTML = `Comparte el código <strong>${codigo}</strong> con los héroes para que se unan. Espera a que todos elijan su héroe y estén listos.`;
    seleccionHeroe.classList.add('oculto');
    btnListoBtn.disabled = false;
  } else {
    instrucciones.textContent = 'Elige tu héroe y confirma cuando estés listo.';
    seleccionHeroe.classList.remove('oculto');
  }
}

function actualizarListaJugadores(jugadores) {
  listaJugadores.innerHTML = '';
  Object.values(jugadores).forEach(j => {
    const card = document.createElement('div');
    card.className = `jugador-lobby-card${j.listo ? ' listo' : ''}`;
    card.dataset.id = j.id;
    card.innerHTML = `
      <div class="nombre">${j.nombre}</div>
      <div class="rol">${j.rol === 'zargon' ? '☠️ Zargon' : j.heroe ? `🗡️ ${j.heroe.nombre || 'Héroe'}` : '⏳ Eligiendo...'}</div>
      ${j.listo ? '<div class="estado-listo">✅ Listo</div>' : ''}
    `;
    listaJugadores.appendChild(card);
  });
}

function mostrarError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.remove('oculto');
  setTimeout(() => errorMsg.classList.add('oculto'), 4000);
}
