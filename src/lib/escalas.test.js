import test from 'node:test'
import assert from 'node:assert/strict'
import { AFINACION, notaEnTraste, obtenerNotasEscala } from './escalas.js'

test('la escala mayor respeta el patrón tono-tono-semitono', () => {
  assert.deepEqual(obtenerNotasEscala('C', 'mayor'), ['C', 'D', 'E', 'F', 'G', 'A', 'B'])
  assert.deepEqual(obtenerNotasEscala('F#', 'mayor'), ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'F'])
})

test('la escala menor natural respeta sus siete grados', () => {
  assert.deepEqual(obtenerNotasEscala('A', 'menor'), ['A', 'B', 'C', 'D', 'E', 'F', 'G'])
  assert.deepEqual(obtenerNotasEscala('C#', 'menor'), ['C#', 'D#', 'E', 'F#', 'G#', 'A', 'B'])
})

test('el diapasón parte de E, B, G, D, A, E y avanza por semitonos', () => {
  assert.deepEqual(AFINACION, ['E', 'B', 'G', 'D', 'A', 'E'])
  assert.equal(notaEnTraste(AFINACION[0], 0), 'E')
  assert.equal(notaEnTraste(AFINACION[0], 1), 'F')
  assert.equal(notaEnTraste(AFINACION[1], 1), 'C')
  assert.equal(notaEnTraste(AFINACION[5], 12), 'E')
  assert.equal(notaEnTraste(AFINACION[5], 15), 'G')
})

