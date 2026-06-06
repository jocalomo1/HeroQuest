const HEROES = {
  barbaro: {
    id: 'barbaro',
    nombre: 'Bárbaro',
    nombreF: 'Bárbara',
    ataque: 3,
    defensa: 2,
    cuerpo: 8,
    mente: 2,
    armaNivel: 3,
    armaInicial: 'espada_ancha',
    hechizos: [],
    puedeMago: false,
    restricciones: ['no_armadura_mago', 'no_armas_mago']
  },
  enano: {
    id: 'enano',
    nombre: 'Enano',
    nombreF: 'Enana',
    ataque: 2,
    defensa: 2,
    cuerpo: 7,
    mente: 3,
    armaInicial: 'espada_corta',
    hechizos: [],
    habilidad: 'desactivar_trampas',
    puedeMago: false
  },
  elfo: {
    id: 'elfo',
    nombre: 'Elfo',
    nombreF: 'Elfa',
    ataque: 2,
    defensa: 2,
    cuerpo: 6,
    mente: 4,
    armaInicial: 'espada_corta',
    hechizos: ['tierra'],
    numHechizos: 3,
    puedeMago: false
  },
  mago: {
    id: 'mago',
    nombre: 'Mago',
    nombreF: 'Maga',
    ataque: 1,
    defensa: 2,
    cuerpo: 4,
    mente: 6,
    armaInicial: 'daga',
    hechizos: ['aire', 'fuego', 'agua'],
    numHechizos: 9,
    puedeMago: true,
    restricciones: ['solo_armadura_mago', 'solo_armas_mago']
  }
};

module.exports = { HEROES };
