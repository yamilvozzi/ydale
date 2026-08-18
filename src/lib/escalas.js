export const NOTAS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

// El orden coincide con la orientación visual pedida: 1.ª a 6.ª cuerda.
export const AFINACION = ['E', 'B', 'G', 'D', 'A', 'E']
export const CANTIDAD_TRASTES = 15
export const TRASTES_DE_REFERENCIA = [3, 5, 7, 9, 12, 15]

export const TIPOS_ESCALA = [
  { valor: 'mayor', etiqueta: 'Mayor' },
  { valor: 'menor', etiqueta: 'Menor' },
  { valor: 'blues', etiqueta: 'Blues' },
  { valor: 'pentatonica_mayor', etiqueta: 'Pentatónica Mayor' },
  { valor: 'pentatonica_menor', etiqueta: 'Pentatónica Menor' },
]

// Distancias sucesivas expresadas en semitonos (un semitono equivale a un traste).
export const INTERVALOS_ESCALA = {
  mayor: [2, 2, 1, 2, 2, 2, 1],
  menor: [2, 1, 2, 2, 1, 2, 2],
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
  return TIPOS_ESCALA.find((opcion) => opcion.valor === tipo)?.etiqueta ?? 'Mayor'
}

export function obtenerNotasEscala(tonica, tipo) {
  const escala = normalizarEscala({ tonica, tipo })
  const indiceTonica = NOTAS.indexOf(escala.tonica)
  const notas = [escala.tonica]
  let distancia = 0

  // El último intervalo vuelve a la octava de la tónica; no se duplica esa nota.
  for (const intervalo of INTERVALOS_ESCALA[escala.tipo].slice(0, -1)) {
    distancia += intervalo
    notas.push(NOTAS[(indiceTonica + distancia) % NOTAS.length])
  }

  return notas
}

/** La ♭5 que distingue a la Blues menor, representada sólo con sostenidos. */
export function obtenerNotaBlues(tonica) {
  const { tonica: tonicaNormalizada } = normalizarEscala({ tonica, tipo: 'blues' })
  const indiceTonica = NOTAS.indexOf(tonicaNormalizada)
  return NOTAS[(indiceTonica + 6) % NOTAS.length]
}

export function notaEnTraste(notaAlAire, traste) {
  const indice = NOTAS.indexOf(notaAlAire)
  if (indice === -1) return null
  return NOTAS[(indice + traste) % NOTAS.length]
}
