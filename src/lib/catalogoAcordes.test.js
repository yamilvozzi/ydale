import test from 'node:test'
import assert from 'node:assert/strict'
import { CATALOGO_ACORDES, filtrarAcordes, RAICES_ACORDES, SUFIJOS_ACORDES } from './catalogoAcordes.js'

test('el catálogo ofrece las calidades y bajos para cada grafía, sin duplicados', () => {
  const nombres = new Set(CATALOGO_ACORDES.map(({ nombre }) => nombre))
  assert.equal(nombres.size, CATALOGO_ACORDES.length)
  for (const raiz of RAICES_ACORDES) {
    for (const sufijo of SUFIJOS_ACORDES) assert.ok(nombres.has(`${raiz}${sufijo}`))
    assert.ok(nombres.has(`${raiz}/F#`))
    assert.ok(nombres.has(`${raiz}/Bb`))
  }
})

test('buscar C excluye C# y Cb y filtra progresivamente la calidad', () => {
  assert.ok(filtrarAcordes('C').every(({ raiz }) => raiz === 'C'))
  assert.deepEqual(filtrarAcordes('Cm').map(({ nombre }) => nombre), ['Cm', 'Cm7', 'Cmaj7', 'Cm6'])
  assert.deepEqual(filtrarAcordes('Cmaj7').map(({ nombre }) => nombre), ['Cmaj7'])
})

test('acepta alteraciones, bajos, minúsculas y búsqueda vacía', () => {
  assert.deepEqual(filtrarAcordes(' d♭m7 ').map(({ nombre }) => nombre), ['Dbm7'])
  assert.deepEqual(filtrarAcordes('C/F♯').map(({ nombre }) => nombre), ['C/F#'])
  assert.equal(filtrarAcordes('').length, CATALOGO_ACORDES.length)
  assert.deepEqual(filtrarAcordes('xyz'), [])
})
