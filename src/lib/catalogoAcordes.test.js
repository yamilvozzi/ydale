import test from 'node:test'
import assert from 'node:assert/strict'
import { CATALOGO_ACORDES, filtrarAcordes, RAICES_ACORDES, SUFIJOS_ACORDES } from './catalogoAcordes.js'
import { interpretarAcorde } from './generadorAcordes.js'

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
  const menores = filtrarAcordes('Cm').map(({ nombre }) => nombre)
  assert.deepEqual(menores.slice(0, 4), ['Cm', 'Cm7', 'Cmaj7', 'Cm6'])
  assert.ok(menores.includes('Cm9') && menores.includes('CmMaj7') && menores.includes('Cm7b5'))
  assert.deepEqual(filtrarAcordes('Cmaj7').map(({ nombre }) => nombre), ['Cmaj7'])
})

test('acepta alteraciones, bajos, minúsculas y búsqueda vacía', () => {
  assert.deepEqual(filtrarAcordes(' d♭m7 ').map(({ nombre }) => nombre), ['Dbm7', 'Dbm7b5'])
  assert.deepEqual(filtrarAcordes('C/F♯').map(({ nombre }) => nombre), ['C/F#'])
  assert.equal(filtrarAcordes('').length, CATALOGO_ACORDES.length)
  assert.deepEqual(filtrarAcordes('xyz'), [])
})

test('todas las sugerencias son interpretables y las nuevas familias se encuentran por nombre', () => {
  for (const { nombre } of CATALOGO_ACORDES) assert.equal(interpretarAcorde(nombre)?.nombre, nombre)
  for (const nombre of ['E9', 'EmMaj7', 'Cdim7', 'Am7b5', 'Cadd9', 'Cmadd9', 'Cadd11', 'Emaj9', 'Em9', 'E7sus4', 'E7b5', 'E7#5', 'E7b9', 'E7#9', 'E7b13', 'E11', 'Em11', 'E13', 'Em13', 'Emaj13']) {
    assert.ok(filtrarAcordes(nombre).some(acorde => acorde.nombre === nombre), nombre)
  }
})
