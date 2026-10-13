import test from 'node:test'
import assert from 'node:assert/strict'
import { estimarBpm, medicionVacia, PAUSA_TAP_MS, registrarTap } from './tapTempo.js'

test('registra 30 golpes y estima 84 BPM usando toda la medición', () => {
  let medicion = medicionVacia()
  for (let i = 0; i < 30; i++) medicion = registrarTap(medicion, i * 60000 / 84)
  assert.equal(medicion.golpes, 30)
  assert.equal(medicion.intervalos.length, 29)
  assert.equal(estimarBpm(medicion.intervalos), 84)
  // Los golpes posteriores al cuarto también influyen en el promedio.
  assert.equal(estimarBpm([...Array(3).fill(500), ...Array(26).fill(550)]), 110)
})

test('tolera fluctuaciones y excluye intervalos de golpes dobles o perdidos', () => {
  assert.equal(estimarBpm([710, 720, 705, 715, 712, 1430, 280, 717, 708, 716]), 84)
  assert.equal(estimarBpm([500, 500, 1000, 500, 250, 500, 500]), 120)
  for (const bpm of [30, 60, 84, 120, 240, 360]) {
    assert.equal(estimarBpm(Array(29).fill(60000 / bpm)), bpm)
  }
})

test('ignora contactos accidentales muy rápidos sin desplazar el último pulso', () => {
  const primero = registrarTap(medicionVacia(), 100)
  assert.strictEqual(registrarTap(primero, 130), primero)
  const segundo = registrarTap(primero, 600)
  assert.deepEqual(segundo.intervalos, [500])
  assert.strictEqual(registrarTap(segundo, 500), segundo)
})

test('pausa, finalización y reinicio no mezclan sesiones', () => {
  let medicion = medicionVacia()
  for (let i = 0; i < 8; i++) medicion = registrarTap(medicion, i * 500)
  assert.equal(estimarBpm(medicion.intervalos), 120)
  for (const nueva of [registrarTap(medicion, medicion.ultima + PAUSA_TAP_MS), registrarTap({ ...medicion, finalizada: true }, medicion.ultima + 100)]) {
    assert.equal(nueva.golpes, 1)
    assert.deepEqual(nueva.intervalos, [])
    assert.equal(nueva.finalizada, false)
    assert.equal(estimarBpm(nueva.intervalos), null)
  }
  assert.equal(estimarBpm([]), null)
  assert.equal(estimarBpm([500]), null)
  assert.deepEqual(medicionVacia(), { ultima: null, intervalos: [], golpes: 0, finalizada: false })
})
