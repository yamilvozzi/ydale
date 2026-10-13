import test from 'node:test'
import assert from 'node:assert/strict'
import { obtenerMarcadoresEscalaConAcorde } from './resaltadoEscala.js'
import { obtenerMarcadoresEscala, NOTAS, TIPOS_ESCALA } from './escalas.js'
import { interpretarAcorde } from './generadorAcordes.js'

const destacadas = marcadores => [...marcadores.values()].filter(nota => !nota.esAtenuada).map(nota => nota.nota)

test('Em permite destacar sus propios acordes sin generar posiciones independientes', () => {
  for (const [acorde, esperadas] of [['Em', ['E', 'G', 'B']], ['C', ['E', 'G', 'C']], ['D', ['F#', 'A', 'D']], ['B7', ['F#', 'A', 'B']]]) {
    const marcadores = obtenerMarcadoresEscalaConAcorde('E', 'menor', acorde)
    assert.equal(marcadores.size, 7)
    assert.deepEqual(destacadas(marcadores), esperadas)
  }
  // D# pertenece a B7 pero no a Em: jamás se incorpora al diapasón.
  assert.equal(obtenerMarcadoresEscalaConAcorde('E', 'menor', 'B7').has('D#'), false)
})

test('restaurar la vista e interpretar una consulta inválida conservan la escala original', () => {
  const originales = obtenerMarcadoresEscala('E', 'menor')
  for (const consulta of [null, undefined, '', 'No es un acorde']) {
    assert.deepEqual(obtenerMarcadoresEscalaConAcorde('E', 'menor', consulta), originales)
  }
  obtenerMarcadoresEscalaConAcorde('E', 'menor', 'C')
  assert.deepEqual(obtenerMarcadoresEscala('E', 'menor'), originales)
})

test('el filtrado mantiene exactamente las notas, modos, grafías, tónica y blue note', () => {
  for (const tonica of [...NOTAS, 'Db', 'Eb', 'Gb', 'Ab', 'Bb']) for (const { valor: tipo } of TIPOS_ESCALA) {
    const originales = obtenerMarcadoresEscala(tonica, tipo)
    const filtradas = obtenerMarcadoresEscalaConAcorde(tonica, tipo, 'Cmaj7')
    const clases = new Set(interpretarAcorde('Cmaj7').notas.map(nota => nota.clase))
    assert.deepEqual([...filtradas.keys()], [...originales.keys()])
    for (const [nota, marcador] of filtradas) {
      const { esAtenuada, ...resto } = marcador
      assert.deepEqual(resto, originales.get(nota))
      assert.equal(esAtenuada, !clases.has(NOTAS.indexOf(nota)))
    }
  }
})

test('los bajos de inversión y equivalentes enarmónicos se filtran por altura musical', () => {
  assert.deepEqual(destacadas(obtenerMarcadoresEscalaConAcorde('E', 'menor', 'C/D')), ['E', 'G', 'C', 'D'])
  assert.deepEqual(obtenerMarcadoresEscalaConAcorde('Db', 'mayor', 'Dbmaj7'), obtenerMarcadoresEscalaConAcorde('Db', 'mayor', 'C#maj7'))
})
