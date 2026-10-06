import test from 'node:test'
import assert from 'node:assert/strict'
import {
  AFINACION,
  NOTAS,
  normalizarEscala,
  notaEnTraste,
  obtenerNotaBlues,
  obtenerNotasEscala,
  obtenerMarcadoresEscala,
} from './escalas.js'

// Referencia cromática independiente del cálculo por intervalos sucesivos.
const OFFSETS_ESPERADOS = {
  mayor: [0, 2, 4, 5, 7, 9, 11],
  dorico: [0, 2, 3, 5, 7, 9, 10],
  frigio: [0, 1, 3, 5, 7, 8, 10],
  lidio: [0, 2, 4, 6, 7, 9, 11],
  mixolidio: [0, 2, 4, 5, 7, 9, 10],
  menor: [0, 2, 3, 5, 7, 8, 10],
  locrio: [0, 1, 3, 5, 6, 8, 10],
  pentatonica_mayor: [0, 2, 4, 7, 9],
  pentatonica_menor: [0, 3, 5, 7, 10],
  blues: [0, 3, 5, 6, 7, 10],
}

test('los diez modos coinciden con sus offsets en las doce tónicas', () => {
  for (const [tipo, offsets] of Object.entries(OFFSETS_ESPERADOS)) {
    for (const [indice, tonica] of NOTAS.entries()) {
      const esperadas = offsets.map((offset) => NOTAS[(indice + offset) % 12])
      const marcadores = obtenerMarcadoresEscala(tonica, tipo)
      assert.deepEqual([...marcadores.keys()], esperadas, `${tonica} ${tipo}`)
      // Decodificar los nombres independientemente: misma altura, otra grafía.
      for (const [cromatica, { nota }] of marcadores) {
        const natural = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[nota[0]]
        const alteracion = [...nota.slice(1)].reduce((n, signo) => n + (signo === '#' ? 1 : -1), 0)
        assert.equal((natural + alteracion + 12) % 12, NOTAS.indexOf(cromatica))
      }
    }
  }
})

test('la normalización conserva los tipos anteriores y nuevos al guardar y editar', () => {
  for (const tipo of Object.keys(OFFSETS_ESPERADOS)) {
    const guardada = { id: 'escala-existente', tonica: 'F#', tipo, orden: 3 }
    assert.deepEqual(normalizarEscala(JSON.parse(JSON.stringify(guardada))), guardada)
  }
  assert.deepEqual(normalizarEscala({ tonica: 'invalid', tipo: 'invalid' }), {
    tonica: 'C', tipo: 'mayor', orden: 0,
  })
})

test('la escala mayor respeta el patrón tono-tono-semitono', () => {
  assert.deepEqual(obtenerNotasEscala('C', 'mayor'), ['C', 'D', 'E', 'F', 'G', 'A', 'B'])
  assert.deepEqual(obtenerNotasEscala('F#', 'mayor'), ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E#'])
})

test('la escala menor natural respeta sus siete grados', () => {
  assert.deepEqual(obtenerNotasEscala('A', 'menor'), ['A', 'B', 'C', 'D', 'E', 'F', 'G'])
  assert.deepEqual(obtenerNotasEscala('C#', 'menor'), ['C#', 'D#', 'E', 'F#', 'G#', 'A', 'B'])
})

test('la escala Blues menor escribe tercera, quinta y séptima rebajadas', () => {
  assert.deepEqual(obtenerNotasEscala('C', 'blues'), ['C', 'Eb', 'F', 'Gb', 'G', 'Bb'])
  assert.deepEqual(obtenerNotasEscala('A', 'blues'), ['A', 'C', 'D', 'Eb', 'E', 'G'])
})

test('la blue note está seis semitonos por encima de la tónica', () => {
  assert.equal(obtenerNotaBlues('C'), 'Gb')
  assert.equal(obtenerNotaBlues('A'), 'Eb')
})

test('la pentatónica mayor usa los grados 1, 2, 3, 5 y 6', () => {
  assert.deepEqual(obtenerNotasEscala('C', 'pentatonica_mayor'), ['C', 'D', 'E', 'G', 'A'])
  assert.deepEqual(obtenerNotasEscala('F#', 'pentatonica_mayor'), ['F#', 'G#', 'A#', 'C#', 'D#'])
})

test('la pentatónica menor usa los grados 1, ♭3, 4, 5 y ♭7', () => {
  assert.deepEqual(obtenerNotasEscala('A', 'pentatonica_menor'), ['A', 'C', 'D', 'E', 'G'])
  assert.deepEqual(obtenerNotasEscala('C', 'pentatonica_menor'), ['C', 'Eb', 'F', 'G', 'Bb'])
})

test('las grafías respetan los grados de cada modo y conservan los marcadores del diapasón', () => {
  for (const [tipo, esperadas] of Object.entries({
    mayor: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    dorico: ['C', 'D', 'Eb', 'F', 'G', 'A', 'Bb'],
    frigio: ['C', 'Db', 'Eb', 'F', 'G', 'Ab', 'Bb'],
    lidio: ['C', 'D', 'E', 'F#', 'G', 'A', 'B'],
    mixolidio: ['C', 'D', 'E', 'F', 'G', 'A', 'Bb'],
    menor: ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb'],
    locrio: ['C', 'Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb'],
  })) assert.deepEqual(obtenerNotasEscala('C', tipo), esperadas)
  assert.deepEqual(obtenerNotasEscala('F', 'mayor'), ['F', 'G', 'A', 'Bb', 'C', 'D', 'E'])
  assert.deepEqual(obtenerNotasEscala('G#', 'mayor'), ['G#', 'A#', 'B#', 'C#', 'D#', 'E#', 'F##'])
  const blues = obtenerMarcadoresEscala('C', 'blues')
  assert.deepEqual(blues.get(notaEnTraste('D', 1)), { nota: 'Eb', esTonica: false, esNotaBlues: false })
  assert.deepEqual(blues.get(notaEnTraste('E', 2)), { nota: 'Gb', esTonica: false, esNotaBlues: true })
  assert.deepEqual(blues.get(notaEnTraste('B', 1)), { nota: 'C', esTonica: true, esNotaBlues: false })
  assert.equal(blues.get(notaEnTraste('E', 0)), undefined)
})

test('el diapasón parte de E, B, G, D, A, E y avanza por semitonos', () => {
  assert.deepEqual(AFINACION, ['E', 'B', 'G', 'D', 'A', 'E'])
  assert.equal(notaEnTraste(AFINACION[0], 0), 'E')
  assert.equal(notaEnTraste(AFINACION[0], 1), 'F')
  assert.equal(notaEnTraste(AFINACION[1], 1), 'C')
  assert.equal(notaEnTraste(AFINACION[5], 12), 'E')
  assert.equal(notaEnTraste(AFINACION[5], 15), 'G')
})
