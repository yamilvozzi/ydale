import test from 'node:test'
import assert from 'node:assert/strict'
import { propuestasDelModal } from './opcionesGenerador.js'
import { generarPosiciones, GRUPOS_CUERDAS, GRUPOS_CUERDAS_4, ZONAS } from './generadorAcordes.js'

test('AUTO único conserva todas las propuestas de ambos AUTO y su orden relativo', () => {
  for (const acorde of ['C', 'D', 'Dm', 'A9', 'C13', 'D/F#']) for (const zona of Object.keys(ZONAS)) for (const bajo of [false, true]) {
    const opciones = { zona, bajo }
    const propuestas = propuestasDelModal(acorde, opciones)
    for (const cantidadCuerdas of [3, 4]) {
      assert.deepEqual(propuestas.filter(p => p.principal.length === cantidadCuerdas), generarPosiciones(acorde, { ...opciones, cantidadCuerdas }))
    }
    assert.equal(new Set(propuestas.map(p => p.id)).size, propuestas.length)
  }
})

test('cada combinación conserva exactamente la generación original de su cantidad de cuerdas', () => {
  for (const cuerdas of [...Object.keys(GRUPOS_CUERDAS), ...Object.keys(GRUPOS_CUERDAS_4)]) {
    for (const zona of Object.keys(ZONAS)) for (const bajo of [false, true]) {
      const opciones = { cuerdas, zona, bajo }
      assert.deepEqual(propuestasDelModal('A9', opciones), generarPosiciones('A9', { ...opciones, cantidadCuerdas: cuerdas.split('–').length }))
    }
  }
})

test('completo conserva su generación, independientemente de los filtros deshabilitados', () => {
  for (const zona of Object.keys(ZONAS)) for (const cuerdas of ['AUTO', '1–2–3', '2–3–4–5']) {
    assert.deepEqual(propuestasDelModal('D/F#', { zona, cuerdas, completo: true, bajo: true }), generarPosiciones('D/F#', { zona, completo: true }))
  }
  assert.deepEqual(propuestasDelModal(null), [])
})
