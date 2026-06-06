// EQUIPO DE ARMERÍA
const EQUIPO = {
  // Armaduras
  yelmo: {
    id: 'yelmo',
    nombre: 'Yelmo',
    tipo: 'armadura',
    bonusDefensa: 1,
    precio: 125,
    restriccion: 'no_mago',
    stock: 3
  },
  escudo: {
    id: 'escudo',
    nombre: 'Escudo',
    tipo: 'armadura',
    bonusDefensa: 1,
    precio: 150,
    restriccion: 'no_mago',
    incompatible: ['hacha_batalla', 'baston'],
    stock: 3
  },
  cota_malla: {
    id: 'cota_malla',
    nombre: 'Cota de Malla',
    tipo: 'armadura',
    bonusDefensa: 1,
    precio: 500,
    restriccion: 'no_mago',
    combinaCon: ['yelmo', 'escudo'],
    stock: 1
  },
  brazaletes: {
    id: 'brazaletes',
    nombre: 'Brazaletes',
    tipo: 'armadura',
    bonusDefensa: 1,
    precio: 550,
    combinaCon: ['yelmo', 'escudo'],
    stock: 1
  },
  coraza: {
    id: 'coraza',
    nombre: 'Coraza',
    tipo: 'armadura',
    bonusDefensa: 2,
    precio: 850,
    restriccion: 'no_mago',
    penalizacion: 'movimiento_1dado',
    combinaCon: ['yelmo', 'escudo'],
    stock: 1
  },
  // Armas
  daga: {
    id: 'daga',
    nombre: 'Daga',
    tipo: 'arma',
    dados: 1,
    precio: 25,
    especial: 'lanzable',
    stock: 4
  },
  baston: {
    id: 'baston',
    nombre: 'Bastón',
    tipo: 'arma',
    dados: 1,
    precio: 100,
    especial: 'diagonal',
    incompatible: ['escudo'],
    stock: 1
  },
  espada_corta: {
    id: 'espada_corta',
    nombre: 'Espada Corta',
    tipo: 'arma',
    dados: 2,
    precio: 150,
    restriccion: 'no_mago',
    stock: 2
  },
  hacha_enana: {
    id: 'hacha_enana',
    nombre: 'Hacha Enana',
    tipo: 'arma',
    dados: 2,
    precio: 200,
    especial: 'lanzable',
    stock: 1
  },
  espada_ancha: {
    id: 'espada_ancha',
    nombre: 'Espada Ancha',
    tipo: 'arma',
    dados: 3,
    precio: 250,
    restriccion: 'no_mago',
    stock: 1
  },
  ballesta: {
    id: 'ballesta',
    nombre: 'Ballesta',
    tipo: 'arma',
    dados: 3,
    precio: 350,
    restriccion: 'no_mago',
    especial: 'distancia_no_adyacente',
    stock: 1
  },
  espada_larga: {
    id: 'espada_larga',
    nombre: 'Espada Larga',
    tipo: 'arma',
    dados: 3,
    precio: 350,
    restriccion: 'no_mago',
    especial: 'diagonal',
    stock: 1
  },
  hacha_batalla: {
    id: 'hacha_batalla',
    nombre: 'Hacha de Batalla',
    tipo: 'arma',
    dados: 4,
    precio: 450,
    restriccion: 'no_mago',
    incompatible: ['escudo'],
    stock: 1
  },
  // Especiales
  agua_bendita: {
    id: 'agua_bendita',
    nombre: 'Agua Bendita',
    tipo: 'especial',
    precio: 400,
    efecto: 'matar_muerto_viviente',
    descarte: true,
    stock: 2
  },
  pocion_velocidad: {
    id: 'pocion_velocidad',
    nombre: 'Poción de Velocidad',
    tipo: 'especial',
    precio: 200,
    efecto: 'doble_movimiento',
    descarte: true,
    stock: 2
  },
  herramientas: {
    id: 'herramientas',
    nombre: 'Conjunto de Herramientas',
    tipo: 'especial',
    precio: 250,
    efecto: 'desactivar_trampa',
    stock: 2
  }
};

// ARTEFACTOS (encontrados en misiones)
const ARTEFACTOS = {
  armadura_borin: {
    id: 'armadura_borin',
    nombre: 'Armadura de Borin',
    tipo: 'artefacto_armadura',
    bonusDefensa: 2,
    restriccion: 'no_mago',
    combinaCon: ['yelmo', 'escudo'],
    descripcion: '+2 dados defensa, NO ralentiza.'
  },
  capa_mago: {
    id: 'capa_mago',
    nombre: 'Capa de Mago',
    tipo: 'artefacto_armadura',
    bonusDefensa: 1,
    restriccion: 'solo_mago',
    descripcion: '+1 dado defensa. Solo Mago/Maga.'
  },
  espada_fortuna: {
    id: 'espada_fortuna',
    nombre: 'Espada Larga de la Fortuna',
    tipo: 'artefacto_arma',
    dados: 3,
    restriccion: 'no_mago',
    especial: 'diagonal',
    habilidad: 'retirar_1dado_por_mision',
    descripcion: '3 dados ataque, diagonal. 1x/misión puede relanzar 1 dado.'
  },
  azote_orcos: {
    id: 'azote_orcos',
    nombre: 'Azote de Orcos',
    tipo: 'artefacto_arma',
    dados: 2,
    restriccion: 'no_mago',
    habilidad: 'doble_ataque_orcos',
    descripcion: '2 dados ataque. Ataca DOS veces contra Orcos.'
  },
  filo_fantasma: {
    id: 'filo_fantasma',
    nombre: 'Filo del Fantasma',
    tipo: 'artefacto_arma',
    dados: 1,
    habilidad: 'sin_defensa_1x_mision',
    descripcion: '1 dado ataque. 1x/misión el objetivo no puede defenderse. Todos.'
  },
  filo_espiritu: {
    id: 'filo_espiritu',
    nombre: 'Filo del Espíritu',
    tipo: 'artefacto_arma',
    dados: 3,
    dadosVsMuertos: 4,
    restriccion: 'no_mago',
    descripcion: '3 dados ataque (4 contra Muertos Vivientes). Único arma que daña al Señor de los Brujos.'
  },
  baculo_mago: {
    id: 'baculo_mago',
    nombre: 'Báculo del Mago',
    tipo: 'artefacto_arma',
    dados: 2,
    restriccion: 'solo_mago',
    especial: 'diagonal',
    descripcion: '2 dados ataque, diagonal. Solo Mago/Maga.'
  },
  vara_telekinesis: {
    id: 'vara_telekinesis',
    nombre: 'Vara de Telekinesis',
    tipo: 'artefacto_herramienta',
    habilidad: 'monstruo_pierde_turno_1x_mision',
    descripcion: '1x/misión: monstruo pierde turno (resiste con 6 en dado por PM).'
  },
  varita_magica: {
    id: 'varita_magica',
    nombre: 'Varita Mágica',
    tipo: 'artefacto_herramienta',
    habilidad: 'dos_hechizos_por_turno',
    descripcion: 'Permite lanzar 2 hechizos distintos en un turno.'
  },
  anillo_retorno: {
    id: 'anillo_retorno',
    nombre: 'Anillo de Retorno',
    tipo: 'artefacto_anillo',
    habilidad: 'teletransporte_inicio_1x',
    descripcion: '1x: teletransporta héroes visibles al punto de partida.'
  },
  anillo_fortaleza: {
    id: 'anillo_fortaleza',
    nombre: 'Anillo de Fortaleza',
    tipo: 'artefacto_anillo',
    habilidad: 'bonus_pc_permanente',
    bonusPC: 1,
    descripcion: '+1 PC permanente.'
  },
  anillo_hechizos: {
    id: 'anillo_hechizos',
    nombre: 'Anillo de Hechizos',
    tipo: 'artefacto_anillo',
    habilidad: 'hechizo_doble',
    descripcion: 'Un hechizo declarado al inicio puede lanzarse dos veces.'
  },
  elixir_vida: {
    id: 'elixir_vida',
    nombre: 'Elixir de Vida',
    tipo: 'artefacto_pocion',
    habilidad: 'revivir_heroe',
    descarte: true,
    descripcion: 'Revive héroe muerto con todos sus PC y PM. Una vez.'
  },
  talisman_sabiduria: {
    id: 'talisman_sabiduria',
    nombre: 'Talismán de la Sabiduría',
    tipo: 'artefacto_amuleto',
    habilidad: 'bonus_pm_permanente',
    bonusPM: 1,
    descripcion: '+1 PM permanente mientras se lleve.'
  }
};

// CARTAS DE TESORO (mazo)
const CARTAS_TESORO = [
  { id: 'gema_1', tipo: 'oro', cantidad: 35, nombre: '¡Gema!', regresaAlMazo: false },
  { id: 'gema_2', tipo: 'oro', cantidad: 35, nombre: '¡Gema!', regresaAlMazo: false },
  { id: 'oro15_1', tipo: 'oro', cantidad: 15, nombre: '¡Oro!', regresaAlMazo: false },
  { id: 'oro15_2', tipo: 'oro', cantidad: 15, nombre: '¡Oro!', regresaAlMazo: false },
  { id: 'oro25_1', tipo: 'oro', cantidad: 25, nombre: '¡Oro!', regresaAlMazo: false },
  { id: 'oro25_2', tipo: 'oro', cantidad: 25, nombre: '¡Oro!', regresaAlMazo: false },
  { id: 'joyas_1', tipo: 'oro', cantidad: 50, nombre: '¡Joyas!', regresaAlMazo: false },
  { id: 'joyas_2', tipo: 'oro', cantidad: 50, nombre: '¡Joyas!', regresaAlMazo: false },
  { id: 'pocion_cur_1', tipo: 'pocion_curativa', nombre: 'Poción Curativa', descripcion: 'Recupera PC = 1 dado rojo.', regresaAlMazo: false },
  { id: 'pocion_cur_2', tipo: 'pocion_curativa', nombre: 'Poción Curativa', descripcion: 'Recupera PC = 1 dado rojo.', regresaAlMazo: false },
  { id: 'pocion_cur_3', tipo: 'pocion_curativa', nombre: 'Poción Curativa', descripcion: 'Recupera PC = 1 dado rojo.', regresaAlMazo: false },
  { id: 'pocion_heroica', tipo: 'pocion_heroica', nombre: 'Poción Heroica', descripcion: 'Puedes atacar dos veces este turno.', regresaAlMazo: false },
  { id: 'pocion_defensa', tipo: 'pocion_defensa', nombre: 'Poción de Defensa', descripcion: '+2 dados de combate al defender.', regresaAlMazo: false },
  { id: 'pocion_fuerza', tipo: 'pocion_fuerza', nombre: 'Poción de Fuerza', descripcion: '+2 dados de combate al atacar.', regresaAlMazo: false },
  { id: 'peligro_hoyo_1', tipo: 'peligro', subTipo: 'hoyo', nombre: '¡Peligro!', descripcion: 'Caes en un hoyo. -1 PC. Fin de turno.', regresaAlMazo: true },
  { id: 'peligro_hoyo_2', tipo: 'peligro', subTipo: 'hoyo', nombre: '¡Peligro!', descripcion: 'Caes en un hoyo. -1 PC. Fin de turno.', regresaAlMazo: true },
  { id: 'peligro_flecha_1', tipo: 'peligro', subTipo: 'flecha', nombre: '¡Peligro!', descripcion: 'Una flecha te alcanza. -1 PC. Fin de turno.', regresaAlMazo: true },
  { id: 'peligro_flecha_2', tipo: 'peligro', subTipo: 'flecha', nombre: '¡Peligro!', descripcion: 'Una flecha te alcanza. -1 PC. Fin de turno.', regresaAlMazo: true },
  { id: 'monstruo_err_1', tipo: 'monstruo_errante', nombre: 'Monstruo Errante', descripcion: 'Zargon coloca el monstruo errante adyacente. Ataca inmediatamente.', regresaAlMazo: true },
  { id: 'monstruo_err_2', tipo: 'monstruo_errante', nombre: 'Monstruo Errante', descripcion: 'Zargon coloca el monstruo errante adyacente. Ataca inmediatamente.', regresaAlMazo: true },
  { id: 'monstruo_err_3', tipo: 'monstruo_errante', nombre: 'Monstruo Errante', descripcion: 'Zargon coloca el monstruo errante adyacente. Ataca inmediatamente.', regresaAlMazo: true },
  { id: 'monstruo_err_4', tipo: 'monstruo_errante', nombre: 'Monstruo Errante', descripcion: 'Zargon coloca el monstruo errante adyacente. Ataca inmediatamente.', regresaAlMazo: true },
  { id: 'monstruo_err_5', tipo: 'monstruo_errante', nombre: 'Monstruo Errante', descripcion: 'Zargon coloca el monstruo errante adyacente. Ataca inmediatamente.', regresaAlMazo: true },
  { id: 'monstruo_err_6', tipo: 'monstruo_errante', nombre: 'Monstruo Errante', descripcion: 'Zargon coloca el monstruo errante adyacente. Ataca inmediatamente.', regresaAlMazo: true },
  { id: 'nada', tipo: 'nada', nombre: '¡Nada!', descripcion: 'No encuentras nada de valor.', regresaAlMazo: false }
];

module.exports = { EQUIPO, ARTEFACTOS, CARTAS_TESORO };
