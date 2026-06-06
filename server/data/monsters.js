const MONSTRUOS = {
  goblin: {
    id: 'goblin',
    nombre: 'Goblin',
    movimiento: 10,
    ataque: 2,
    defensa: 1,
    cuerpo: 1,
    mente: 1,
    tipo: 'normal'
  },
  orco: {
    id: 'orco',
    nombre: 'Orco',
    movimiento: 8,
    ataque: 3,
    defensa: 2,
    cuerpo: 1,
    mente: 2,
    tipo: 'normal'
  },
  abominacion: {
    id: 'abominacion',
    nombre: 'Abominación',
    movimiento: 6,
    ataque: 3,
    defensa: 3,
    cuerpo: 2,
    mente: 3,
    tipo: 'normal'
  },
  zombi: {
    id: 'zombi',
    nombre: 'Zombi',
    movimiento: 5,
    ataque: 2,
    defensa: 3,
    cuerpo: 1,
    mente: 0,
    tipo: 'muerto_viviente'
  },
  esqueleto: {
    id: 'esqueleto',
    nombre: 'Esqueleto',
    movimiento: 6,
    ataque: 2,
    defensa: 2,
    cuerpo: 1,
    mente: 0,
    tipo: 'muerto_viviente'
  },
  momia: {
    id: 'momia',
    nombre: 'Momia',
    movimiento: 4,
    ataque: 3,
    defensa: 4,
    cuerpo: 2,
    mente: 0,
    tipo: 'muerto_viviente'
  },
  guerrero_terror: {
    id: 'guerrero_terror',
    nombre: 'Guerrero del Terror',
    movimiento: 7,
    ataque: 4,
    defensa: 4,
    cuerpo: 3,
    mente: 3,
    tipo: 'normal'
  },
  gargola: {
    id: 'gargola',
    nombre: 'Gárgola',
    movimiento: 6,
    ataque: 4,
    defensa: 5,
    cuerpo: 3,
    mente: 4,
    tipo: 'normal'
  }
};

module.exports = { MONSTRUOS };
