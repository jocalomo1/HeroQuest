// ─────────────────────────────────────────
// UI: Paneles, modales y componentes
// ─────────────────────────────────────────

const UI = {

  // ── LOG ──
  agregarLog(mensaje, tipo = 'info') {
    const log = document.getElementById('mensajes-log');
    if (!log) return;
    const div = document.createElement('div');
    div.className = `log-entrada ${tipo}`;
    div.textContent = `> ${mensaje}`;
    log.prepend(div);
    // Limitar a 100 entradas
    while (log.children.length > 100) log.removeChild(log.lastChild);
  },

  // ── STATS DE HÉROE ──
  actualizarStatsHeroe(heroe) {
    if (!heroe) return;
    document.getElementById('mi-heroe-nombre').textContent = heroe.nombre;

    const pcPct = heroe.cuerpoActual / heroe.cuerpoMax * 100;
    const barPC = document.getElementById('barra-pc');
    barPC.innerHTML = `<div class="barra-stat-fill pc${pcPct <= 25 ? ' bajo' : pcPct <= 50 ? ' medio' : ''}" style="width:${pcPct}%"></div>`;
    document.getElementById('pc-texto').textContent = `${heroe.cuerpoActual}/${heroe.cuerpoMax}`;

    const pmPct = heroe.menteMax > 0 ? heroe.menteActual / heroe.menteMax * 100 : 0;
    const barPM = document.getElementById('barra-pm');
    barPM.innerHTML = `<div class="barra-stat-fill pm" style="width:${pmPct}%"></div>`;
    document.getElementById('pm-texto').textContent = `${heroe.menteActual}/${heroe.menteMax}`;

    document.getElementById('oro-texto').textContent = heroe.oro || 0;

    this.actualizarInventario(heroe);
    this.actualizarHechizos(heroe);
  },

  actualizarInventario(heroe) {
    const lista = document.getElementById('lista-inventario');
    if (!lista) return;
    lista.innerHTML = '';

    (heroe.inventario || []).forEach(item => {
      const div = document.createElement('div');
      div.className = 'item-inventario';
      div.innerHTML = `
        <span>${item.nombre}</span>
        <span style="font-size:0.7rem;color:var(--color-texto-dim)">${
          item.tipo === 'arma' ? `${item.dados}d⚔️` :
          item.tipo === 'armadura' ? `+${item.bonusDefensa}🛡️` : ''
        }</span>
      `;
      div.addEventListener('click', () => window.juego?.usarItem(item.id));
      lista.appendChild(div);
    });

    // Armaduras
    (heroe.armaduras || []).forEach(armId => {
      const div = document.createElement('div');
      div.className = 'item-inventario';
      div.style.borderColor = '#5a5a80';
      div.textContent = armId.replace(/_/g, ' ');
      lista.appendChild(div);
    });

    // Artefactos
    (heroe.artefactos || []).forEach(artId => {
      const div = document.createElement('div');
      div.className = 'item-inventario';
      div.style.borderColor = '#804a20';
      div.textContent = artId.replace(/_/g, ' ');
      lista.appendChild(div);
    });
  },

  actualizarHechizos(heroe) {
    const seccion = document.getElementById('hechizos-seccion');
    const lista = document.getElementById('lista-hechizos');
    if (!lista) return;

    if (!heroe.hechizosDisponibles?.length && !heroe.hechizosUsados?.length) {
      seccion.classList.add('oculto');
      return;
    }
    seccion.classList.remove('oculto');
    lista.innerHTML = '';

    const NOMBRES_HECHIZOS = {
      tempestad_aire: 'Tempestad', rafaga: 'Ráfaga', genio: 'Genio',
      fuego_ira: 'Fuego de la Ira', valentia: 'Valentía', bola_fuego: 'Bola de Fuego',
      agua_milagrosa: 'Agua Milagrosa', niebla: 'Niebla', dormir: 'Dormir',
      piel_roca: 'Piel de Roca', cura_corporal: 'Cura Corporal', traves_roca: 'A Través de la Roca'
    };

    const GRUPOS = {
      tempestad_aire: 'Aire', rafaga: 'Aire', genio: 'Aire',
      fuego_ira: 'Fuego', valentia: 'Fuego', bola_fuego: 'Fuego',
      agua_milagrosa: 'Agua', niebla: 'Agua', dormir: 'Agua',
      piel_roca: 'Tierra', cura_corporal: 'Tierra', traves_roca: 'Tierra'
    };

    (heroe.hechizosDisponibles || []).forEach(id => {
      const div = document.createElement('div');
      div.className = 'item-hechizo';
      div.innerHTML = `<span>${NOMBRES_HECHIZOS[id] || id}</span><span style="font-size:0.7rem;color:var(--color-info)">${GRUPOS[id] || ''}</span>`;
      div.addEventListener('click', () => window.juego?.iniciarHechizo(id));
      lista.appendChild(div);
    });

    (heroe.hechizosUsados || []).forEach(id => {
      const div = document.createElement('div');
      div.className = 'item-hechizo usado';
      div.innerHTML = `<span>${NOMBRES_HECHIZOS[id] || id}</span><span style="font-size:0.7rem">✗ Usado</span>`;
      lista.appendChild(div);
    });
  },

  // ── PANEL HÉROES ──
  actualizarPanelHeroes(jugadores, turnoActualId) {
    const lista = document.getElementById('lista-heroes');
    if (!lista) return;
    lista.innerHTML = '';

    Object.entries(jugadores).forEach(([id, j]) => {
      if (!j.heroe) return;
      const div = document.createElement('div');
      div.className = `heroe-card${id === turnoActualId ? ' turno-activo' : ''}`;
      const pct = j.heroe.cuerpoActual / j.heroe.cuerpoMax * 100;
      const claseVida = pct <= 25 ? 'bajo' : pct <= 50 ? 'medio' : '';
      div.innerHTML = `
        <div class="hc-nombre${!j.heroe.vivo ? ' hc-muerto' : ''}">${j.heroe.nombre}</div>
        <div class="barra-vida"><div class="barra-vida-fill ${claseVida}" style="width:${pct}%"></div></div>
        <div style="font-size:0.72rem;color:var(--color-texto-dim)">PC: ${j.heroe.cuerpoActual}/${j.heroe.cuerpoMax}</div>
        ${id === turnoActualId ? '<div style="font-size:0.7rem;color:var(--color-primario)">► Su turno</div>' : ''}
      `;
      lista.appendChild(div);
    });
  },

  // ── PANEL ZARGON ──
  actualizarPanelZargon(monstruos, hechizosDisponibles) {
    const listaMonstruos = document.getElementById('lista-monstruos-zargon');
    if (listaMonstruos) {
      listaMonstruos.innerHTML = '';
      Object.values(monstruos || {}).forEach(m => {
        if (!m.vivo) return;
        const div = document.createElement('div');
        div.className = 'monstruo-zargon-item';
        div.dataset.uid = m.uid;
        div.innerHTML = `
          <div class="mz-nombre">${m.nombre}</div>
          <div class="mz-stats">PC: ${m.pcActual}/${m.pcMax || m.pcActual} | ATQ: ${m.ataque} | DEF: ${m.defensa}</div>
          <div class="monstruo-acciones">
            <button class="btn-monstruo btn-mover-m" data-uid="${m.uid}">Mover</button>
            <button class="btn-monstruo btn-atacar-m" data-uid="${m.uid}">Atacar</button>
          </div>
        `;
        div.querySelector('.btn-mover-m').addEventListener('click', () => window.juego?.iniciarMoverMonstruo(m.uid));
        div.querySelector('.btn-atacar-m').addEventListener('click', () => window.juego?.iniciarAtaqueMonstruo(m.uid));
        listaMonstruos.appendChild(div);
      });
    }

    const listaHechizos = document.getElementById('lista-hechizos-zargon');
    if (listaHechizos) {
      listaHechizos.innerHTML = '';

      const HECHIZOS_INFO = {
        tempestad_z: { nombre: 'Tempestad', desc: 'Un héroe pierde su turno.' },
        invocar_muertos: { nombre: 'Invocar Muertos Vivientes', desc: 'Invoca esqueletos, zombis o momias.' },
        invocar_orcos: { nombre: 'Invocar Orcos', desc: 'Invoca 4-6 orcos.' },
        dormir_z: { nombre: 'Dormir', desc: 'Héroe no puede moverse/atacar.' },
        oxidacion: { nombre: 'Oxidación', desc: 'Destruye espada o yelmo metálico.' },
        rayo_mortifero: { nombre: 'Rayo Mortífero', desc: '2 daños en línea recta.' },
        bola_llamas: { nombre: 'Bola en Llamas', desc: '2 daños a un héroe.' },
        nube_terror: { nombre: 'Nube de Terror', desc: 'Paraliza todos en la habitación.' },
        dominacion: { nombre: 'Dominación', desc: 'Controla a un héroe.' },
        huida_fugaz: { nombre: 'Huída Fugaz', desc: 'Teletransporta monstruo a lugar seguro.' },
        miedo: { nombre: 'Miedo', desc: 'Héroe ataca con 1 dado.' },
        tormenta_fuego: { nombre: 'Tormenta de Fuego', desc: '3 daños a todos en la habitación.' }
      };

      (hechizosDisponibles || []).forEach(id => {
        const info = HECHIZOS_INFO[id] || { nombre: id, desc: '' };
        const div = document.createElement('div');
        div.className = 'hechizo-zargon-item';
        div.innerHTML = `<div class="hz-nombre">${info.nombre}</div><div class="hz-desc">${info.desc}</div>`;
        div.addEventListener('click', () => window.juego?.lanzarHechizoZargon(id));
        listaHechizos.appendChild(div);
      });
    }
  },

  // ── MODAL DADOS ──
  mostrarDados(titulo, dados, descripcion) {
    const modal = document.getElementById('modal-dados');
    document.getElementById('modal-titulo').textContent = titulo;
    document.getElementById('modal-descripcion').textContent = descripcion || '';

    const container = document.getElementById('dados-resultado');
    container.innerHTML = '';

    dados.forEach(d => {
      const div = document.createElement('div');
      div.className = `dado-visual ${d.tipo === 'blanco' ? 'dado-blanco' : d.tipo === 'negro' ? 'dado-negro' : 'dado-rojo'}`;
      const simbolo = d.resultado === 'calavera' ? '💀' :
                      d.resultado === 'escudo_blanco' ? '🛡️' :
                      d.resultado === 'escudo_negro' ? '⬛' :
                      d.resultado === 'casco' ? '⛑️' :
                      d.resultado.toString();
      div.textContent = simbolo;
      container.appendChild(div);
    });

    modal.classList.remove('oculto');
    return new Promise(resolve => {
      document.getElementById('modal-cerrar').onclick = () => {
        modal.classList.add('oculto');
        resolve();
      };
    });
  },

  // ── MODAL CARTA TESORO ──
  mostrarCarta(carta) {
    const modal = document.getElementById('modal-carta');
    const iconos = {
      oro: '🪙', pocion_curativa: '🧪', pocion_heroica: '⚡',
      pocion_defensa: '🛡️', pocion_fuerza: '💪', peligro: '⚠️',
      monstruo_errante: '👾', nada: '🌑'
    };
    document.getElementById('carta-icono').textContent = iconos[carta.tipo] || '❓';
    document.getElementById('carta-titulo').textContent = carta.nombre;
    document.getElementById('carta-descripcion').textContent = carta.descripcion ||
      (carta.cantidad ? `+${carta.cantidad} monedas de oro` : '');
    modal.classList.remove('oculto');

    return new Promise(resolve => {
      document.getElementById('carta-cerrar').onclick = () => {
        modal.classList.add('oculto');
        resolve();
      };
    });
  },

  // ── MODAL FIN MISIÓN ──
  mostrarFinMision(resultado) {
    const modal = document.getElementById('modal-fin-mision');
    const titulo = document.getElementById('fin-titulo');
    const desc = document.getElementById('fin-descripcion');

    if (resultado.resultado === 'victoria') {
      titulo.textContent = '🏆 ¡Misión Completada!';
      titulo.style.color = '#4caf74';
    } else {
      titulo.textContent = '💀 Derrota';
      titulo.style.color = '#c04040';
    }

    desc.textContent = resultado.razon || '';
    modal.classList.remove('oculto');

    return new Promise(resolve => {
      document.getElementById('fin-continuar').onclick = () => {
        modal.classList.add('oculto');
        resolve();
      };
    });
  },

  // ── MODAL ARMERÍA ──
  mostrarArmeria(equipo, heroeTipo, oro, onComprar) {
    const modal = document.getElementById('modal-armeria');
    document.getElementById('oro-armeria').textContent = oro;
    const tienda = document.getElementById('tienda-items');
    tienda.innerHTML = '';

    Object.values(equipo).forEach(item => {
      if (item.restriccion === 'no_mago' && heroeTipo === 'mago') return;
      if (item.restriccion === 'solo_mago' && heroeTipo !== 'mago') return;

      const div = document.createElement('div');
      div.className = 'tienda-item';
      const puedePagar = oro >= item.precio;
      if (!puedePagar) div.style.opacity = '0.5';

      div.innerHTML = `
        <div class="ti-nombre">${item.nombre}</div>
        <div class="ti-precio">${item.precio} 🪙</div>
        <div class="ti-desc">${
          item.tipo === 'arma' ? `${item.dados} dados de ataque` :
          item.bonusDefensa ? `+${item.bonusDefensa} dados de defensa` :
          item.efecto?.replace(/_/g, ' ') || ''
        }</div>
      `;

      if (puedePagar) {
        div.addEventListener('click', () => onComprar(item.id));
      }

      tienda.appendChild(div);
    });

    modal.classList.remove('oculto');
    document.getElementById('armeria-cerrar').onclick = () => modal.classList.add('oculto');
  },

  // ── BANNER TURNO ──
  mostrarBannerTurno(texto) {
    const banner = document.getElementById('tu-turno-banner');
    banner.querySelector('span').textContent = texto;
    banner.classList.remove('oculto');
    setTimeout(() => banner.classList.add('oculto'), 3000);
  },

  // ── TOGGLE PANELES ──
  mostrarPanelHeroe() {
    document.getElementById('mi-heroe-panel').classList.remove('oculto');
    document.getElementById('zargon-panel').classList.add('oculto');
    document.getElementById('acciones-turno').classList.remove('oculto');
  },

  mostrarPanelZargon() {
    document.getElementById('zargon-panel').classList.remove('oculto');
    document.getElementById('mi-heroe-panel').classList.add('oculto');
    document.getElementById('acciones-turno').classList.remove('oculto');
  },

  habilitarAcciones(esMiTurno) {
    const btns = document.querySelectorAll('.btn-accion');
    btns.forEach(b => b.disabled = !esMiTurno);
  },

  // ── TOOLTIP ──
  mostrarTooltip(x, y, html) {
    let tt = document.querySelector('.tooltip-tablero');
    if (!tt) {
      tt = document.createElement('div');
      tt.className = 'tooltip-tablero';
      document.getElementById('overlay-tablero').appendChild(tt);
    }
    tt.innerHTML = html;
    tt.style.left = `${x + 10}px`;
    tt.style.top = `${y - 30}px`;
    tt.style.display = 'block';
  },

  ocultarTooltip() {
    const tt = document.querySelector('.tooltip-tablero');
    if (tt) tt.style.display = 'none';
  }
};

window.UI = UI;
