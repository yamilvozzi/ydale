export const NOTAS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

// El orden coincide con la orientación visual pedida: 1.ª a 6.ª cuerda.
export const AFINACION = ['E', 'B', 'G', 'D', 'A', 'E']
export const CANTIDAD_TRASTES = 15
export const TRASTES_DE_REFERENCIA = [3, 5, 7, 9, 12, 15]

export const TIPOS_ESCALA = [
  { valor: 'mayor', etiqueta: 'Jónico (Mayor)' },
  { valor: 'lidio', etiqueta: 'Lidio' },
  { valor: 'mixolidio', etiqueta: 'Mixolidio' },
  { valor: 'pentatonica_mayor', etiqueta: 'Pent. Mayor' },
  { valor: 'locrio', etiqueta: 'Locrio' },
  { valor: 'menor', etiqueta: 'Eólico (Menor)' },
  { valor: 'dorico', etiqueta: 'Dórico' },
  { valor: 'frigio', etiqueta: 'Frigio' },
  { valor: 'pentatonica_menor', etiqueta: 'Pent. Menor' },
  { valor: 'blues', etiqueta: 'Blues' },
]

// Distancias sucesivas expresadas en semitonos (un semitono equivale a un traste).
export const INTERVALOS_ESCALA = {
  mayor: [2, 2, 1, 2, 2, 2, 1],
  menor: [2, 1, 2, 2, 1, 2, 2],
  dorico: [2, 1, 2, 2, 2, 1, 2],
  frigio: [1, 2, 2, 2, 1, 2, 2],
  lidio: [2, 2, 2, 1, 2, 2, 1],
  mixolidio: [2, 2, 1, 2, 2, 1, 2],
  locrio: [1, 2, 2, 1, 2, 2, 2],
  blues: [3, 2, 1, 1, 3, 2],
  pentatonica_mayor: [2, 2, 3, 2, 3],
  pentatonica_menor: [3, 2, 2, 3, 2],
}

export function crearEscala() {
  return { tonica: 'C', tipo: 'mayor' }
}

export function normalizarEscala(escala = {}) {
  return {
    ...(escala.id ? { id: escala.id } : {}),
    tonica: NOTAS.includes(escala.tonica) ? escala.tonica : 'C',
    tipo: Object.hasOwn(INTERVALOS_ESCALA, escala.tipo) ? escala.tipo : 'mayor',
    orden: Number.isInteger(escala.orden) ? escala.orden : 0,
  }
}

export function etiquetaTipo(tipo) {
  return TIPOS_ESCALA.find((opcion) => opcion.valor === tipo)?.etiqueta ?? TIPOS_ESCALA[0].etiqueta
}

const NATURALES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
const LETRAS = Object.keys(NATURALES)
// Grados desde cero. En blues, la quinta disminuida y la justa comparten letra.
const GRADOS_ESCALA = {
  pentatonica_mayor: [0, 1, 2, 4, 5],
  pentatonica_menor: [0, 2, 3, 4, 6],
  blues: [0, 2, 3, 4, 4, 6],
}

/** Claves cromáticas para ubicar las notas; nombres diatónicos para mostrarlas. */
export function obtenerMarcadoresEscala(tonica, tipo) {
  const escala = normalizarEscala({ tonica, tipo })
  const indiceTonica = NOTAS.indexOf(escala.tonica)
  const grados = GRADOS_ESCALA[escala.tipo] ?? [0, 1, 2, 3, 4, 5, 6]
  const notas = new Map()
  let distancia = 0

  for (const [indice, intervalo] of INTERVALOS_ESCALA[escala.tipo].entries()) {
    const clase = (indiceTonica + distancia) % 12
    const letra = LETRAS[(LETRAS.indexOf(escala.tonica[0]) + grados[indice]) % 7]
    const alteracion = (clase - NATURALES[letra] + 18) % 12 - 6
    const nota = letra + (alteracion < 0 ? 'b'.repeat(-alteracion) : '#'.repeat(alteracion))
    notas.set(NOTAS[clase], {
      nota,
      esTonica: indice === 0,
      esNotaBlues: escala.tipo === 'blues' && indice === 3,
    })
    // El último intervalo vuelve a la octava, que no se duplica.
    distancia += intervalo
  }

  return notas
}

export function obtenerNotasEscala(tonica, tipo) {
  return [...obtenerMarcadoresEscala(tonica, tipo).values()].map(({ nota }) => nota)
}

/** La quinta disminuida que distingue a la Blues menor. */
export function obtenerNotaBlues(tonica) {
  return obtenerNotasEscala(tonica, 'blues')[3]
}

export function notaEnTraste(notaAlAire, traste) {
  const indice = NOTAS.indexOf(notaAlAire)
  if (indice === -1) return null
  return NOTAS[(indice + traste) % NOTAS.length]
}
