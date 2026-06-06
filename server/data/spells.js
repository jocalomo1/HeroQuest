const HECHIZOS_HEROES = {
  // AIRE - Mago
  tempestad_aire: {
    id: 'tempestad_aire',
    nombre: 'Tempestad',
    grupo: 'aire',
    descripcion: 'Un monstruo pierde su siguiente turno.',
    objetivo: 'monstruo',
    efecto: 'saltar_turno'
  },
  rafaga: {
    id: 'rafaga',
    nombre: 'Ráfaga',
    grupo: 'aire',
    descripcion: 'Un héroe lanza el doble de dados rojos en su próximo movimiento.',
    objetivo: 'heroe',
    efecto: 'doble_movimiento'
  },
  genio: {
    id: 'genio',
    nombre: 'Genio',
    grupo: 'aire',
    descripcion: 'Abre cualquier puerta del tablero, O ataca un monstruo visible con 5 dados de combate.',
    objetivo: 'puerta_o_monstruo',
    efecto: 'abrir_puerta_o_ataque_5dados'
  },
  // FUEGO - Mago
  fuego_ira: {
    id: 'fuego_ira',
    nombre: 'Fuego de la Ira',
    grupo: 'fuego',
    descripcion: '1 daño a monstruo. El monstruo puede evitarlo sacando 5 o 6 en 1 dado.',
    objetivo: 'monstruo',
    efecto: 'dano_1_evitable'
  },
  valentia: {
    id: 'valentia',
    nombre: 'Valentía',
    grupo: 'fuego',
    descripcion: 'Un héroe tira 2 dados extra en su próximo ataque. Se rompe si no hay monstruos visibles.',
    objetivo: 'heroe',
    efecto: 'bonus_ataque_2dados'
  },
  bola_fuego: {
    id: 'bola_fuego',
    nombre: 'Bola de Fuego',
    grupo: 'fuego',
    descripcion: '2 daños a monstruo. Por cada 5-6 en 2 dados del monstruo, reduce 1 daño.',
    objetivo: 'monstruo',
    efecto: 'dano_2_reducible'
  },
  // AGUA - Mago
  agua_milagrosa: {
    id: 'agua_milagrosa',
    nombre: 'Agua Milagrosa',
    grupo: 'agua',
    descripcion: 'Cura hasta 4 PC a un héroe (sin superar máximo).',
    objetivo: 'heroe',
    efecto: 'curar_4pc'
  },
  niebla: {
    id: 'niebla',
    nombre: 'Niebla',
    grupo: 'agua',
    descripcion: 'Un héroe puede moverse por casillas con monstruos sin ser visto en su próximo movimiento.',
    objetivo: 'heroe',
    efecto: 'atravesar_monstruos'
  },
  dormir: {
    id: 'dormir',
    nombre: 'Dormir',
    grupo: 'agua',
    descripcion: 'Monstruo no puede moverse/atacar/defenderse. No funciona en muertos vivientes. Se rompe con 6 (1 dado/PM).',
    objetivo: 'monstruo',
    efecto: 'dormir',
    noFunciona: ['muerto_viviente']
  },
  // TIERRA - Elfa
  piel_roca: {
    id: 'piel_roca',
    nombre: 'Piel de Roca',
    grupo: 'tierra',
    descripcion: '+1 dado de defensa hasta recibir 1 daño.',
    objetivo: 'heroe',
    efecto: 'bonus_defensa_1dado'
  },
  cura_corporal: {
    id: 'cura_corporal',
    nombre: 'Cura Corporal',
    grupo: 'tierra',
    descripcion: 'Restaura hasta 4 PC a un héroe (sin superar máximo).',
    objetivo: 'heroe',
    efecto: 'curar_4pc'
  },
  traves_roca: {
    id: 'traves_roca',
    nombre: 'A Través de la Roca',
    grupo: 'tierra',
    descripcion: 'El héroe puede atravesar paredes en su siguiente movimiento. Cuidado: Roca Sólida = queda atrapado.',
    objetivo: 'heroe',
    efecto: 'atravesar_paredes'
  }
};

const HECHIZOS_ZARGON = {
  tempestad_z: {
    id: 'tempestad_z',
    nombre: 'Tempestad',
    descripcion: 'Un héroe pierde su siguiente turno.',
    objetivo: 'heroe',
    efecto: 'saltar_turno'
  },
  invocar_muertos: {
    id: 'invocar_muertos',
    nombre: 'Invocar Muertos Vivientes',
    descripcion: 'Tira 1 dado: 1-2=4 Esqueletos, 3-4=3 Esq.+2 Zombis, 5-6=2 Zombis+2 Momias.',
    objetivo: 'tablero',
    efecto: 'invocar_muertos_vivientes'
  },
  invocar_orcos: {
    id: 'invocar_orcos',
    nombre: 'Invocar Orcos',
    descripcion: 'Tira 1 dado: 1-3=4 Orcos, 4-5=5 Orcos, 6=6 Orcos.',
    objetivo: 'tablero',
    efecto: 'invocar_orcos'
  },
  dormir_z: {
    id: 'dormir_z',
    nombre: 'Dormir',
    descripcion: 'Héroe no puede moverse/atacar/defenderse. Se rompe con 6 (1 dado/PM).',
    objetivo: 'heroe',
    efecto: 'dormir_heroe'
  },
  oxidacion: {
    id: 'oxidacion',
    nombre: 'Oxidación',
    descripcion: 'Destruye permanentemente cualquier Espada o Yelmo metálico (no artefactos).',
    objetivo: 'heroe',
    efecto: 'destruir_arma_yelmo'
  },
  rayo_mortifero: {
    id: 'rayo_mortifero',
    nombre: 'Rayo Mortífero',
    descripcion: '2 daños en línea recta hasta pared/puerta cerrada. Afecta a todo en su camino.',
    objetivo: 'linea',
    efecto: 'rayo_2dano'
  },
  bola_llamas: {
    id: 'bola_llamas',
    nombre: 'Bola en Llamas',
    descripcion: '2 daños a un héroe. Por cada 5-6 en 2 dados del héroe, reduce 1 daño.',
    objetivo: 'heroe',
    efecto: 'dano_2_reducible'
  },
  nube_terror: {
    id: 'nube_terror',
    nombre: 'Nube de Terror',
    descripcion: 'Paraliza a todos los héroes en la misma habitación/pasillo. Se rompe con 6 (1 dado/PM).',
    objetivo: 'zona',
    efecto: 'paralizar_zona'
  },
  dominacion: {
    id: 'dominacion',
    nombre: 'Dominación',
    descripcion: 'Zargon controla al héroe. Se rompe con 6 (1 dado/PM).',
    objetivo: 'heroe',
    efecto: 'controlar_heroe'
  },
  huida_fugaz: {
    id: 'huida_fugaz',
    nombre: 'Huída Fugaz',
    descripcion: 'Zargon/monstruo se teletransporta al lugar seguro marcado en el mapa.',
    objetivo: 'monstruo_o_jefe',
    efecto: 'teletransportar_seguro'
  },
  miedo: {
    id: 'miedo',
    nombre: 'Miedo',
    descripcion: 'Un héroe solo puede usar 1 dado de combate para atacar. Se rompe con 6 (1 dado/PM).',
    objetivo: 'heroe',
    efecto: 'reducir_ataque_1dado'
  },
  tormenta_fuego: {
    id: 'tormenta_fuego',
    nombre: 'Tormenta de Fuego',
    descripcion: '3 daños a todos en la misma habitación (excepto lanzador). No funciona en pasillos.',
    objetivo: 'habitacion',
    efecto: 'dano_3_zona'
  }
};

module.exports = { HECHIZOS_HEROES, HECHIZOS_ZARGON };
