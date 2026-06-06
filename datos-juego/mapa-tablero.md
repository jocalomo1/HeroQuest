# MAPA DEL TABLERO HEROQUEST

Tablero: **26 columnas × 19 filas** (incluyendo bordes de muro exterior).
Los cuadros amarillos son PASILLOS (transitables). Las líneas negras gruesas son MUROS (infranqueables).
Hay **22 salas** numeradas del 1 al 22. La Sala 22 es la central y más grande.

---

## DIMENSIONES POR SALA

| Sala | Ancho (X) | Alto (Y) | Zona | Notas |
|------|-----------|----------|------|-------|
| 1    | 4         | 3        | Superior-Izquierda | Esquina sup-izq |
| 2    | 4         | 3        | Superior-Izquierda | A la derecha de S1 |
| 3    | 3         | 5        | Superior-Izquierda | Más alta que S1/S2 |
| 4    | 4         | 5        | Media-Izquierda    | Debajo de S1 |
| 5    | 5         | 5        | Media-Izquierda    | Debajo de S2/S3 |
| 6    | 3         | 5        | Superior-Derecha   | Alta, inicio cluster derecho |
| 7    | 4         | 4        | Superior-Derecha   | A la derecha de S6 |
| 8    | 4         | 4        | Superior-Derecha   | Esquina sup-der |
| 9    | 4         | 4        | Media-Derecha      | Debajo de S6/S7 |
| 10   | 4         | 4        | Media-Derecha      | Debajo de S7/S8 |
| 11   | 1         | 4        | Inferior-Izquierda | Estrecha, borde izquierdo |
| 12   | 4         | 4        | Inferior-Izquierda | Esquina inf-izq |
| 13   | 2         | 3        | Inferior-Izquierda | Pequeña |
| 14   | 2         | 3        | Inferior-Izquierda | Pequeña, junto a S13 |
| 15   | 4         | 5        | Inferior-Izquierda | Debajo de S13/S14 |
| 16   | 4         | 5        | Inferior-Izquierda | A la derecha de S15 |
| 17   | 4         | 5        | Inferior-Derecha   | |
| 18   | 3 o 4     | 4 o 3    | Inferior-Derecha   | Ver nota R19 |
| 19   | 3/4       | 4/3      | Inferior-Derecha   | ASIMÉTRICA: 2 lados de 3 y 2 lados de 4 |
| 20   | 4         | 4        | Inferior-Derecha   | |
| 21   | 4         | 4        | Inferior-Derecha   | Esquina inf-der |
| 22   | 6         | 5        | **CENTRAL**        | La más grande — hub del mapa |

---

## LAYOUT POR ZONAS

El tablero tiene 5 zonas separadas por pasillos amarillos:

```
╔══════════════════════════════════════════════════════════════╗
║  CLUSTER SUPERIOR-IZQUIERDO  │  CLUSTER SUPERIOR-DERECHO    ║
║  S1(4×3)  S2(4×3)  S3(3×5)  │  S6(3×5)  S7(4×4)  S8(4×4) ║
║  S4(4×5)  S5(5×5)            │  S9(4×4)  S10(4×4)          ║
╠══════════════════════════════╪══════════════════════════════╣
║              SALA CENTRAL S22 (6×5)                         ║
╠══════════════════════════════╪══════════════════════════════╣
║  CLUSTER INFERIOR-IZQUIERDO  │  CLUSTER INFERIOR-DERECHO   ║
║  S11(1×4)  S13(2×3) S14(2×3)│  S19(3×4) S20(4×4)          ║
║  S12(4×4)  S15(4×5) S16(4×5)│  S17(4×5) S18(3×4) S21(4×4) ║
╚══════════════════════════════════════════════════════════════╝
```

---

## POSICIONES EN LA CUADRÍCULA (columna, fila) — 1-indexed, 0=borde

### Cluster Superior-Izquierdo
| Sala | Col inicio | Fila inicio | Col fin | Fila fin |
|------|-----------|------------|---------|---------|
| S1   | 1         | 1          | 4       | 3       |
| S2   | 5         | 1          | 8       | 3       |
| S3   | 10        | 1          | 12      | 5       |
| S4   | 1         | 4          | 4       | 8       |
| S5   | 5         | 4          | 9       | 8       |

### Cluster Superior-Derecho
| Sala | Col inicio | Fila inicio | Col fin | Fila fin |
|------|-----------|------------|---------|---------|
| S6   | 14        | 1          | 16      | 5       |
| S7   | 17        | 1          | 20      | 4       |
| S8   | 21        | 1          | 24      | 4       |
| S9   | 14        | 5          | 17      | 8       |
| S10  | 18        | 5          | 21      | 8       |

### Pasillo central vertical
- Columna 13, filas 1–8 (separa cluster izq de cluster der)

### Sala Central
| Sala | Col inicio | Fila inicio | Col fin | Fila fin |
|------|-----------|------------|---------|---------|
| S22  | 10        | 9          | 15      | 13      |

### Cluster Inferior-Izquierdo
| Sala | Col inicio | Fila inicio | Col fin | Fila fin |
|------|-----------|------------|---------|---------|
| S11  | 1         | 10         | 1       | 13      |
| S13  | 2         | 10         | 3       | 12      |
| S14  | 4         | 10         | 5       | 12      |
| S12  | 1         | 14         | 4       | 17      |
| S15  | 5         | 13         | 8       | 17      |
| S16  | 9         | 13         | 12      | 17      |

### Cluster Inferior-Derecho
| Sala | Col inicio | Fila inicio | Col fin | Fila fin |
|------|-----------|------------|---------|---------|
| S19  | 14        | 13         | 16      | 16      |
| S20  | 17        | 13         | 20      | 16      |
| S17  | 14        | 13         | 17      | 17      |
| S18  | 18        | 14         | 20      | 17      |
| S21  | 21        | 13         | 24      | 16      |

---

## PASILLOS PRINCIPALES (casillas amarillas transitables)

- **Pasillo vertical central**: col 13, filas 1–8 (divide clusters superiores)
- **Pasillo horizontal medio**: filas 9–13 en lados de S22 (acceso a sala central)
- **Pasillo horizontal inferior**: fila 13 aprox., cols 1–24 (separa zona media de inferior)
- **Pasillo lateral izquierdo**: col 9 aprox., filas 1–8 (entre S3 y S2/S5)
- **Pasillos de acceso a S22**: desde cada cluster hacia la sala central
- **Pasillos inferiores**: entre S12/S15/S16 y S17/S18/S21

---

## NOTAS IMPORTANTES

- **S11** es la sala más estrecha (1×4) — puede representar un pasillo-sala o celda
- **S19** es la única sala **asimétrica**: 2 lados miden 3 y 2 lados miden 4
- **S22** es el HUB central: todas las rutas convergen hacia ella
- Las salas **S3** y **S6** son altas (3×5) y actúan como conectores entre filas
- Los clusters superiores e inferiores están separados por la zona central de S22
