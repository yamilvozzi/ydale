import test from 'node:test'
import assert from 'node:assert/strict'
import {
  AFINACION,
  NOTAS,
  normalizarEscala,
  notaEnTraste,
  obtenerNotaBlues,
  obtenerNotasEscala,
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
      assert.deepEqual(obtenerNotasEscala(tonica, tipo), esperadas, `${tonica} ${tipo}`)
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
  assert.deepEqual(obtenerNotasEscala('F#', 'mayor'), ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'F'])
})

test('la escala menor natural respeta sus siete grados', () => {
  assert.deepEqual(obtenerNotasEscala('A', 'menor'), ['A', 'B', 'C', 'D', 'E', 'F', 'G'])
  assert.deepEqual(obtenerNotasEscala('C#', 'menor'), ['C#', 'D#', 'E', 'F#', 'G#', 'A', 'B'])
})

test('la escala Blues menor incluye seis notas y usa sostenidos', () => {
  assert.deepEqual(obtenerNotasEscala('C', 'blues'), ['C', 'D#', 'F', 'F#', 'G', 'A#'])
  assert.deepEqual(obtenerNotasEscala('A', 'blues'), ['A', 'C', 'D', 'D#', 'E', 'G'])
})

test('la blue note está seis semitonos por encima de la tónica', () => {
  assert.equal(obtenerNotaBlues('C'), 'F#')
  assert.equal(obtenerNotaBlues('A'), 'D#')
})

test('la pentatónica mayor usa los grados 1, 2, 3, 5 y 6', () => {
  assert.deepEqual(obtenerNotasEscala('C', 'pentatonica_mayor'), ['C', 'D', 'E', 'G', 'A'])
  assert.deepEqual(obtenerNotasEscala('F#', 'pentatonica_mayor'), ['F#', 'G#', 'A#', 'C#', 'D#'])
})

test('la pentatónica menor usa los grados 1, ♭3, 4, 5 y ♭7', () => {
  assert.deepEqual(obtenerNotasEscala('A', 'pentatonica_menor'), ['A', 'C', 'D', 'E', 'G'])
  assert.deepEqual(obtenerNotasEscala('C', 'pentatonica_menor'), ['C', 'D#', 'F', 'G', 'A#'])
})

test('el diapasón parte de E, B, G, D, A, E y avanza por semitonos', () => {
  assert.deepEqual(AFINACION, ['E', 'B', 'G', 'D', 'A', 'E'])
  assert.equal(notaEnTraste(AFINACION[0], 0), 'E')
  assert.equal(notaEnTraste(AFINACION[0], 1), 'F')
  assert.equal(notaEnTraste(AFINACION[1], 1), 'C')
  assert.equal(notaEnTraste(AFINACION[5], 12), 'E')
  assert.equal(notaEnTraste(AFINACION[5], 15), 'G')
})
