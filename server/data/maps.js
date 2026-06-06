// Tipos de casilla
// 0 = vacío/muro sólido (fuera del mapa)
// 1 = suelo de habitación
// 2 = pasillo
// 3 = puerta (horizontal: abre arriba/abajo)
// 4 = puerta (vertical: abre izquierda/derecha)
// 5 = escalera (entrada)
// 6 = escalera (salida)
// 7 = mueble / obstáculo intransitable

// Cada misión define:
// - grid: matriz 2D de tipos de casilla
// - rooms: { id: { name, cells:[{x,y}], revealed:false } }
// - doors: [{x,y,orientation,id,open:false}]
// - monsters: [{type, x, y, uid, roomId, pcActual, especial}]
// - specialPoints: [{id, x, y, tipo, data}]
// - stairs: {entrada:{x,y}, salida:{x,y}}
// - wanderingMonster: tipo de monstruo errante

// Helper para generar celdas de un rectángulo
function rect(x1, y1, x2, y2) {
  const cells = [];
  for (let y = y1; y <= y2; y++)
    for (let x = x1; x <= x2; x++)
      cells.push({ x, y });
  return cells;
}

// ─────────────────────────────────────────
// MISIÓN 1: La Prueba
// Mapa fiel a la imagen oficial: 22 cols × 17 filas
//
// Layout:
//   Sala C (Momia)  : cols 1-8,  filas 1-6  (arriba-izquierda)
//   Sala D (84 oro) : cols 11-18, filas 1-5  (arriba-derecha)
//   Corredor central: fila 8,   cols 0-20
//   Rama vertical C : col 4,    filas 6-8
//   Rama vertical D : col 14,   filas 5-8
//   Sala A (armas)  : cols 3-7,  filas 11-14 (abajo-izquierda)
//   Sala Verag (E)  : cols 11-19, filas 11-15 (abajo-derecha, boss)
//   Sala B (vacía)  : cols 19-21, filas 7-9  (pequeña, derecha)
// ─────────────────────────────────────────
const mision1 = {
  id: 1,
  nombre: 'Misión 1: La Prueba',
  objetivo: 'Destruir a Verag, la Gárgola.',
  descripcion: 'Verag se oculta en las catacumbas. Búscala y destrúyela.',
  wanderingMonster: 'orco',
  tieneTrampas: false,
  tienePuertasSecretas: false,
  recompensa: 0,
  grid: [
  //   0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21
    [  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 0
    [  0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0], // 1
    [  0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0], // 2
    [  0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0], // 3
    [  0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0], // 4
    [  0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0], // 5
    [  0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0], // 6  puerta D
    [  0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1, 1, 0], // 7  puerta C + rama D + sala B
    [  5, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 4, 1, 0], // 8  corredor principal
    [  0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1, 1, 0], // 9  ramas abajo + sala B
    [  0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0], // 10
    [  0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0], // 11 puertas abajo
    [  0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0], // 12
    [  0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0], // 13
    [  0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0], // 14
    [  0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0], // 15
    [  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 16
  ],
  rooms: {
    sala_pasillo: {
      name: 'Corredor de Entrada', pasillo: true,
      cells: [
        ...rect(0, 8, 18, 8),   // corredor horizontal
        {x:4,y:7}, {x:4,y:9}, {x:4,y:10},  // rama C arriba/abajo
        {x:14,y:7}, {x:14,y:9}, {x:14,y:10} // rama D/Verag
      ]
    },
    sala_c: {
      name: 'Tumba de Fellmarg (C)',
      cells: rect(1, 1, 8, 6)
    },
    sala_d: {
      name: 'Sala D — Cofre 84 oro',
      cells: rect(11, 1, 18, 5)
    },
    sala_b: {
      name: 'Sala B — Cofre vacío',
      cells: [{x:19,y:7},{x:20,y:7},{x:19,y:8},{x:20,y:8},{x:19,y:9},{x:20,y:9}]
    },
    sala_a: {
      name: 'Sala A — Estante de Armas',
      cells: rect(3, 12, 7, 15)
    },
    sala_verag: {
      name: 'Guarida de Verag (E)',
      cells: rect(11, 12, 19, 15)
    }
  },
  doors: [
    { id: 'd_c',     x: 4,  y: 7,  orientation: 'h', roomA: 'sala_pasillo', roomB: 'sala_c',     open: false },
    { id: 'd_d',     x: 14, y: 6,  orientation: 'h', roomA: 'sala_pasillo', roomB: 'sala_d',     open: false },
    { id: 'd_b',     x: 19, y: 8,  orientation: 'v', roomA: 'sala_pasillo', roomB: 'sala_b',     open: false },
    { id: 'd_a',     x: 4,  y: 11, orientation: 'h', roomA: 'sala_pasillo', roomB: 'sala_a',     open: false },
    { id: 'd_verag', x: 14, y: 11, orientation: 'h', roomA: 'sala_pasillo', roomB: 'sala_verag', open: false }
  ],
  stairs: { entrada: { x: 0, y: 8 } },
  monsters: [
    // Sala C: Momia guardián (4 dados de ataque) + 2 Orcos
    { uid: 'm1_momia', type: 'momia', x: 4, y: 3, roomId: 'sala_c', pcActual: 2,
      especial: { ataqueDados: 4 }, nombre: 'Guardián de Fellmarg' },
    { uid: 'm1_orco_c1', type: 'orco', x: 2, y: 2, roomId: 'sala_c', pcActual: 1 },
    { uid: 'm1_orco_c2', type: 'orco', x: 7, y: 5, roomId: 'sala_c', pcActual: 1 },
    // Sala D: 2 Orcos
    { uid: 'm1_orco_d1', type: 'orco', x: 13, y: 2, roomId: 'sala_d', pcActual: 1 },
    { uid: 'm1_orco_d2', type: 'orco', x: 16, y: 4, roomId: 'sala_d', pcActual: 1 },
    // Sala A: 1 Orco
    { uid: 'm1_orco_a1', type: 'orco', x: 5, y: 13, roomId: 'sala_a', pcActual: 1 },
    // Sala Verag: Verag (boss) + 3 Orcos
    { uid: 'm1_verag', type: 'gargola', x: 15, y: 13, roomId: 'sala_verag', pcActual: 3,
      esBoss: true, nombre: 'Verag' },
    { uid: 'm1_orco_v1', type: 'orco', x: 12, y: 12, roomId: 'sala_verag', pcActual: 1 },
    { uid: 'm1_orco_v2', type: 'orco', x: 18, y: 14, roomId: 'sala_verag', pcActual: 1 },
    { uid: 'm1_orco_v3', type: 'orco', x: 14, y: 15, roomId: 'sala_verag', pcActual: 1 }
  ],
  specialPoints: [
    { id: 'sp_A', x: 5, y: 13, tipo: 'estante_armas',
      data: { descripcion: 'A — Estante de Armas: armas rotas y oxidadas. Sin valor.', usada: false } },
    { id: 'sp_B', x: 19, y: 8, tipo: 'cofre_vacio',
      data: { descripcion: 'B — El cofre está completamente vacío.', usada: false } },
    { id: 'sp_D', x: 14, y: 3, tipo: 'tesoro_especial',
      data: { descripcion: 'D — Cofre con 84 monedas de oro.', oro: 84, usada: false } },
    { id: 'sp_E', x: 15, y: 14, tipo: 'tesoro_especial',
      data: { descripcion: 'E — Cofre con 120 monedas de oro.', oro: 120, usada: false } }
  ]
};

// ─────────────────────────────────────────
// MISIÓN 2: El Rescate de Sir Ragnar
// ─────────────────────────────────────────
const mision2 = {
  id: 2,
  nombre: 'Misión 2: El Rescate de Sir Ragnar',
  objetivo: 'Encontrar a Sir Ragnar y escoltarlo vivo a la escalera.',
  descripcion: 'Sir Ragnar está prisionero. Encuéntralo y llévalo a la escalera.',
  wanderingMonster: 'orco',
  recompensa: 240,
  grid: [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,1,1,1,1,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0],
    [0,0,1,1,1,1,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0],
    [0,0,1,1,1,1,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0],
    [0,0,0,4,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0],
    [0,5,2,2,2,2,2,2,2,2,2,2,2,2,2,2,4,1,1,1,0,0],
    [0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0],
    [0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0],
    [0,0,0,1,1,2,1,1,0,1,1,1,0,0,1,1,1,0,0,0,0,0],
    [0,0,0,1,1,2,1,1,0,1,1,1,0,0,1,1,1,0,0,0,0,0],
    [0,0,0,1,1,2,1,1,0,1,1,1,0,0,1,1,1,0,0,0,0,0],
    [0,0,0,0,0,3,0,0,0,0,3,0,0,0,0,3,0,0,0,0,0,0],
    [0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0],
    [0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
  rooms: {
    sala_inicio: { name: 'Pasillo Principal', pasillo: true, cells: [{x:1,y:5},{x:2,y:5},{x:3,y:5},{x:4,y:5},{x:5,y:5},{x:6,y:5},{x:7,y:5},{x:8,y:5},{x:9,y:5},{x:10,y:5},{x:11,y:5},{x:12,y:5},{x:13,y:5},{x:14,y:5},{x:15,y:5},{x:5,y:6},{x:5,y:7},{x:5,y:8},{x:5,y:9},{x:5,y:10} ] },
    sala_nw: { name: 'Sala Noroeste', cells: [{x:2,y:1},{x:3,y:1},{x:4,y:1},{x:5,y:1},{x:2,y:2},{x:3,y:2},{x:4,y:2},{x:5,y:2},{x:2,y:3},{x:3,y:3},{x:4,y:3},{x:5,y:3}] },
    sala_ne: { name: 'Sala Noreste', cells: [{x:9,y:1},{x:10,y:1},{x:11,y:1},{x:12,y:1},{x:9,y:2},{x:10,y:2},{x:11,y:2},{x:12,y:2},{x:9,y:3},{x:10,y:3},{x:11,y:3},{x:12,y:3}] },
    sala_este: { name: 'Sala Este (Sir Ragnar)', cells: [{x:17,y:5},{x:18,y:5},{x:19,y:5},{x:17,y:6},{x:18,y:6},{x:19,y:6},{x:17,y:7},{x:18,y:7},{x:19,y:7}] },
    sala_sw1: { name: 'Sala SO 1', cells: [{x:3,y:8},{x:4,y:8},{x:3,y:9},{x:4,y:9},{x:3,y:10},{x:4,y:10},{x:6,y:8},{x:7,y:8},{x:6,y:9},{x:7,y:9},{x:6,y:10},{x:7,y:10}] },
    sala_sw2: { name: 'Sala SO 2', cells: [{x:9,y:8},{x:10,y:8},{x:11,y:8},{x:9,y:9},{x:10,y:9},{x:11,y:9},{x:9,y:10},{x:10,y:10},{x:11,y:10}] },
    sala_se: { name: 'Sala SE', cells: [{x:14,y:8},{x:15,y:8},{x:16,y:8},{x:14,y:9},{x:15,y:9},{x:16,y:9},{x:14,y:10},{x:15,y:10},{x:16,y:10}] },
    sala_sur: { name: 'Sala Sur', cells: [{x:5,y:12},{x:6,y:12},{x:7,y:12},{x:8,y:12},{x:9,y:12},{x:10,y:12},{x:11,y:12},{x:12,y:12},{x:13,y:12},{x:14,y:12},{x:15,y:12},{x:16,y:12},{x:5,y:13},{x:6,y:13},{x:7,y:13},{x:8,y:13},{x:9,y:13},{x:10,y:13},{x:11,y:13},{x:12,y:13},{x:13,y:13},{x:14,y:13},{x:15,y:13},{x:16,y:13}] }
  },
  doors: [
    { id: 'd1', x: 3, y: 4, orientation: 'h', roomA: 'sala_inicio', roomB: 'sala_nw', open: false },
    { id: 'd2', x: 10, y: 4, orientation: 'v', roomA: 'sala_inicio', roomB: 'sala_ne', open: false },
    { id: 'd3', x: 16, y: 5, orientation: 'v', roomA: 'sala_inicio', roomB: 'sala_este', open: false },
    { id: 'd4', x: 5, y: 11, orientation: 'h', roomA: 'sala_inicio', roomB: 'sala_sur', open: false },
    { id: 'd5', x: 10, y: 11, orientation: 'h', roomA: 'sala_sur', roomB: 'sala_sw2', open: false },
    { id: 'd6', x: 15, y: 11, orientation: 'h', roomA: 'sala_sur', roomB: 'sala_se', open: false }
  ],
  stairs: { entrada: { x: 1, y: 5 } },
  monsters: [
    { uid: 'm2_orco1', type: 'orco', x: 3, y: 9, roomId: 'sala_sw1', pcActual: 1 },
    { uid: 'm2_orco2', type: 'orco', x: 10, y: 9, roomId: 'sala_sw2', pcActual: 1 },
    { uid: 'm2_orco3', type: 'orco', x: 15, y: 9, roomId: 'sala_se', pcActual: 1 },
    { uid: 'm2_orco4', type: 'orco', x: 11, y: 12, roomId: 'sala_sur', pcActual: 1 },
    { uid: 'm2_orco5', type: 'orco', x: 8, y: 13, roomId: 'sala_sur', pcActual: 1 },
    { uid: 'm2_sir_ragnar', type: 'sir_ragnar', x: 18, y: 6, roomId: 'sala_este', pcActual: 2, esAliado: true, nombre: 'Sir Ragnar', ataque: 0, defensa: 2, movimiento: 1 }
  ],
  specialPoints: [
    { id: 'sp_A', x: 4, y: 2, tipo: 'cofre_trampa', data: { trampa: 'aguja', dano: 1, descripcion: 'Trampa de Aguja Envenenada: -1 PC.', usada: false } },
    { id: 'sp_B', x: 10, y: 9, tipo: 'tesoro_especial', data: { descripcion: '60 monedas de oro + Poción Curativa.', oro: 60, item: 'pocion_curativa_4pc', usada: false } }
  ]
};

// ─────────────────────────────────────────
// MISIÓN 3: La Guarida del Caudillo Orco
// ─────────────────────────────────────────
const mision3 = {
  id: 3,
  nombre: 'Misión 3: La Guarida del Caudillo Orco',
  objetivo: 'Eliminar a Ulag, el Caudillo Orco.',
  descripcion: 'Ulag lidera a los orcos. Acaba con él para liberar estas tierras.',
  wanderingMonster: 'orco',
  recompensa: 180,
  grid: [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,5,2,2,2,2,2,2,2,2,2,2,2,4,1,1,1,1,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,2,0,0,0,0,1,1,1,1,0,0,0,0],
    [0,0,0,1,1,1,1,0,0,2,0,0,0,0,1,1,1,1,0,0,0,0],
    [0,0,0,1,1,1,1,0,0,2,0,0,0,0,1,1,1,1,0,0,0,0],
    [0,0,0,1,1,1,1,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,4,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0],
    [0,0,0,0,1,1,1,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0],
    [0,0,0,0,1,1,1,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0],
    [0,0,0,0,1,1,1,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
  rooms: {
    sala_inicio: { name: 'Pasillo', pasillo: true, cells: [{x:1,y:5},{x:2,y:5},{x:3,y:5},{x:4,y:5},{x:5,y:5},{x:6,y:5},{x:7,y:5},{x:8,y:5},{x:9,y:5},{x:10,y:5},{x:11,y:5},{x:12,y:5},{x:9,y:6},{x:9,y:7},{x:9,y:8}] },
    sala_a: { name: 'Armería Orcos (A)', cells: [{x:6,y:1},{x:7,y:1},{x:8,y:1},{x:9,y:1},{x:10,y:1},{x:6,y:2},{x:7,y:2},{x:8,y:2},{x:9,y:2},{x:10,y:2},{x:6,y:3},{x:7,y:3},{x:8,y:3},{x:9,y:3},{x:10,y:3}] },
    sala_b: { name: 'Sala B (Cofre + Poción)', cells: [{x:14,y:5},{x:15,y:5},{x:16,y:5},{x:17,y:5},{x:14,y:6},{x:15,y:6},{x:16,y:6},{x:17,y:6},{x:14,y:7},{x:15,y:7},{x:16,y:7},{x:17,y:7},{x:14,y:8},{x:15,y:8},{x:16,y:8},{x:17,y:8}] },
    sala_c: { name: 'Sala Oeste', cells: [{x:3,y:7},{x:4,y:7},{x:5,y:7},{x:6,y:7},{x:3,y:8},{x:4,y:8},{x:5,y:8},{x:6,y:8},{x:3,y:9},{x:4,y:9},{x:5,y:9},{x:6,y:9}] },
    sala_ulag: { name: 'Sala de Ulag', cells: [{x:9,y:10},{x:10,y:10},{x:11,y:10},{x:12,y:10},{x:13,y:10},{x:14,y:10},{x:15,y:10},{x:9,y:11},{x:10,y:11},{x:11,y:11},{x:12,y:11},{x:13,y:11},{x:14,y:11},{x:15,y:11},{x:9,y:12},{x:10,y:12},{x:11,y:12},{x:12,y:12},{x:13,y:12},{x:14,y:12},{x:15,y:12},{x:9,y:13},{x:10,y:13},{x:11,y:13},{x:12,y:13},{x:13,y:13},{x:14,y:13},{x:15,y:13}] },
    sala_sw: { name: 'Sala Suroeste', cells: [{x:4,y:11},{x:5,y:11},{x:6,y:11},{x:4,y:12},{x:5,y:12},{x:6,y:12},{x:4,y:13},{x:5,y:13},{x:6,y:13}] }
  },
  doors: [
    { id: 'd1', x: 7, y: 4, orientation: 'v', roomA: 'sala_inicio', roomB: 'sala_a', open: false },
    { id: 'd2', x: 13, y: 5, orientation: 'v', roomA: 'sala_inicio', roomB: 'sala_b', open: false },
    { id: 'd3', x: 4, y: 10, orientation: 'v', roomA: 'sala_inicio', roomB: 'sala_sw', open: false },
    { id: 'd4', x: 9, y: 9, orientation: 'h', roomA: 'sala_inicio', roomB: 'sala_ulag', open: false }
  ],
  stairs: { entrada: { x: 1, y: 5 } },
  monsters: [
    { uid: 'm3_orco1', type: 'orco', x: 7, y: 2, roomId: 'sala_a', pcActual: 1 },
    { uid: 'm3_orco2', type: 'orco', x: 9, y: 2, roomId: 'sala_a', pcActual: 1 },
    { uid: 'm3_orco3', type: 'orco', x: 15, y: 6, roomId: 'sala_b', pcActual: 1 },
    { uid: 'm3_orco4', type: 'orco', x: 5, y: 8, roomId: 'sala_c', pcActual: 1 },
    { uid: 'm3_orco5', type: 'orco', x: 5, y: 12, roomId: 'sala_sw', pcActual: 1 },
    { uid: 'm3_orco6', type: 'orco', x: 11, y: 11, roomId: 'sala_ulag', pcActual: 1 },
    { uid: 'm3_orco7', type: 'orco', x: 13, y: 11, roomId: 'sala_ulag', pcActual: 1 },
    { uid: 'm3_ulag', type: 'orco', x: 12, y: 12, roomId: 'sala_ulag', pcActual: 2, esBoss: true, nombre: 'Ulag', movimiento: 10, ataque: 4, defensa: 5, mente: 3 }
  ],
  specialPoints: [
    { id: 'sp_A', x: 8, y: 2, tipo: 'armeria_monstruo', data: { descripcion: 'Armería Orco: el primer héroe que busque encuentra un Bastón.', item: 'baston', usada: false } },
    { id: 'sp_B', x: 15, y: 7, tipo: 'tesoro_especial', data: { descripcion: '24 monedas de oro + Poción Curativa.', oro: 24, item: 'pocion_curativa_4pc', usada: false } }
  ]
};

// Plantilla simplificada para misiones 4-14
// Se añadirá mapa detallado en iteraciones posteriores
function crearMisionSimple(id, nombre, objetivo, wanderingMonster, recompensa, monstruosBoss) {
  return {
    id,
    nombre,
    objetivo,
    wanderingMonster,
    recompensa,
    // Mapa genérico 20x15 mientras se implementa el mapa real
    grid: generarGridSimple(),
    rooms: {
      sala_inicio: { name: 'Entrada', pasillo: true, cells: generarCeldasPasillo() },
      sala_principal: { name: 'Sala Principal', cells: generarCeldasSala(8, 4, 5, 5) },
      sala_final: { name: 'Sala Final', cells: generarCeldasSala(14, 8, 5, 5) }
    },
    doors: [
      { id: 'd1', x: 10, y: 5, orientation: 'v', roomA: 'sala_inicio', roomB: 'sala_principal', open: false },
      { id: 'd2', x: 14, y: 9, orientation: 'v', roomA: 'sala_principal', roomB: 'sala_final', open: false }
    ],
    stairs: { entrada: { x: 1, y: 7 } },
    monsters: monstruosBoss || [],
    specialPoints: []
  };
}

function generarGridSimple() {
  const grid = [];
  for (let y = 0; y < 15; y++) {
    const row = [];
    for (let x = 0; x < 22; x++) {
      if (y === 0 || y === 14 || x === 0 || x === 21) row.push(0);
      else if (y === 7 && x >= 1 && x <= 20) row.push(2);
      else if (x >= 8 && x <= 12 && y >= 4 && y <= 8) row.push(1);
      else if (x >= 14 && x <= 18 && y >= 8 && y <= 12) row.push(1);
      else row.push(0);
    }
    grid.push(row);
  }
  return grid;
}

function generarCeldasPasillo() {
  const cells = [];
  for (let x = 1; x <= 20; x++) cells.push({ x, y: 7 });
  return cells;
}

function generarCeldasSala(startX, startY, w, h) {
  const cells = [];
  for (let y = startY; y < startY + h; y++)
    for (let x = startX; x < startX + w; x++)
      cells.push({ x, y });
  return cells;
}

const mision4 = crearMisionSimple(4, 'Misión 4: El Oro del Príncipe Magnus',
  'Recuperar 3 Cofres del Tesoro y llevarlos a la escalera.', 'abominacion', 240,
  [{ uid: 'm4_gulthor', type: 'guerrero_terror', x: 15, y: 10, roomId: 'sala_final', pcActual: 3, esBoss: true, nombre: 'Gulthor' }]
);

const mision5 = crearMisionSimple(5, 'Misión 5: El Laberinto de Melar',
  'Encontrar el Talismán de la Sabiduría.', 'zombi', 0, []);

const mision6 = crearMisionSimple(6, 'Misión 6: El Legado del Caudillo Orco',
  'Recuperar el equipo y escapar por la Escalera B.', 'abominacion', 0,
  [{ uid: 'm6_grak', type: 'guerrero_terror', x: 15, y: 10, roomId: 'sala_final', pcActual: 3, esBoss: true, nombre: 'Grak', movimiento: 8, ataque: 4, defensa: 4, mente: 3, hechizos: ['miedo', 'dormir_z', 'tempestad_z'] }]
);

const mision7 = crearMisionSimple(7, 'Misión 7: El Mago Perdido',
  'Averiguar qué le pasó al mago Wardoz.', 'momia', 100, []);

const mision8 = crearMisionSimple(8, 'Misión 8: La Magia de Fuego',
  'Encontrar y eliminar a Balur, el mago del fuego.', 'abominacion', 100,
  [{ uid: 'm8_balur', type: 'guerrero_terror', x: 15, y: 4, roomId: 'sala_principal', pcActual: 3, esBoss: true, nombre: 'Balur', movimiento: 8, ataque: 2, defensa: 5, mente: 7, inmune: ['fuego'], hechizos: ['bola_llamas', 'tormenta_fuego', 'tempestad_z', 'invocar_orcos', 'miedo', 'huida_fugaz'] }]
);

const mision9 = crearMisionSimple(9, 'Misión 9: La Carrera Contra el Tiempo',
  'Escapar volviendo a la escalera.', 'abominacion', 0, []);

const mision10 = crearMisionSimple(10, 'Misión 10: El Castillo Misterioso',
  'Eliminar todos los monstruos O volver a la escalera con tirada de 2 o 12.', 'fantasma_ollar', 0, []);

const mision11 = crearMisionSimple(11, 'Misión 11: El Bastión del Terror',
  'Matar a todos los monstruos.', 'abominacion', 0, []);

const mision12 = crearMisionSimple(12, 'Misión 12: Barak Tor',
  'Encontrar la Estrella de Occidente y volver a la escalera.', 'esqueleto', 200, []);

const mision13 = crearMisionSimple(13, 'Misión 13: En Busca del Filo del Espíritu',
  'Encontrar el Filo del Espíritu.', 'guerrero_terror', 0, []);

const mision14 = crearMisionSimple(14, 'Misión 14: Retorno a Barak Tor',
  'Derrotar al Señor de los Brujos con el Filo del Espíritu.', 'momia', 0,
  [{ uid: 'm14_senhor', type: 'guerrero_terror', x: 15, y: 4, roomId: 'sala_principal', pcActual: 4, esBoss: true, nombre: 'El Señor de los Brujos', movimiento: 10, ataque: 5, defensa: 6, mente: 6, inmune: ['todo_excepto_filo_espiritu'], hechizos: ['invocar_muertos', 'miedo', 'miedo', 'bola_llamas', 'dominacion', 'tempestad_z'] }]
);

const MISIONES = [
  mision1, mision2, mision3, mision4, mision5,
  mision6, mision7, mision8, mision9, mision10,
  mision11, mision12, mision13, mision14
];

module.exports = { MISIONES };
